"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Circle, Group, Image as KonvaImage, Layer, Line, Rect, Stage, Text } from "react-konva";
import type Konva from "konva";
import { deviceCatalog, layerColors } from "@/lib/device-catalog";
import type { Device, DeviceType, FloorPlan, LayerType, PlanDrawingTool, PlanElement, PlanElementType } from "@/lib/types";

const CANVAS_WIDTH = 1120;
const CANVAS_HEIGHT = 720;
const CLUSTER_DISTANCE = 44;

export function PlanCanvas({
  plan,
  devices,
  planElements,
  drawingTool,
  visibleLayers,
  selectedDeviceId,
  readonly,
  onAddDevice,
  onAddPlanElement,
  onMoveDevice,
  onSelectDevice
}: {
  plan: FloorPlan;
  devices: Device[];
  planElements: PlanElement[];
  drawingTool: PlanDrawingTool;
  visibleLayers: Record<LayerType, boolean>;
  selectedDeviceId?: string;
  readonly?: boolean;
  onAddDevice: (type: DeviceType, x: number, y: number) => void;
  onAddPlanElement: (type: PlanElementType, element: Omit<PlanElement, "id" | "projectId" | "planId" | "type">) => void;
  onMoveDevice: (deviceId: string, x: number, y: number) => void;
  onSelectDevice: (deviceId: string) => void;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const [size, setSize] = useState({ width: 900, height: 620 });
  const [stageScale, setStageScale] = useState(0.82);
  const [stagePos, setStagePos] = useState({ x: 20, y: 20 });
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [draft, setDraft] = useState<{ startX: number; startY: number; x: number; y: number } | null>(null);
  const [expandedClusterId, setExpandedClusterId] = useState<string | null>(null);

  useEffect(() => {
    const resize = () => {
      if (!wrapperRef.current) return;
      setSize({
        width: Math.max(wrapperRef.current.clientWidth, 320),
        height: Math.max(wrapperRef.current.clientHeight, 320)
      });
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  useEffect(() => {
    if (!plan.sourceUrl || plan.sourceType !== "image") {
      setImage(null);
      return;
    }
    const nextImage = new window.Image();
    if (plan.sourceUrl.startsWith("http")) {
      nextImage.crossOrigin = "anonymous";
    }
    nextImage.onload = () => {
      if (nextImage.naturalWidth > 0 && nextImage.naturalHeight > 0) {
        setImage(nextImage);
      } else {
        setImage(null);
      }
    };
    nextImage.onerror = () => setImage(null);
    nextImage.src = plan.sourceUrl;
  }, [plan.sourceType, plan.sourceUrl]);

  const visibleDevices = useMemo(() => devices.filter((device) => visibleLayers[device.layer]), [devices, visibleLayers]);
  const deviceClusters = useMemo(() => clusterDevices(visibleDevices), [visibleDevices]);

  function getPointerOnPlan() {
    const stage = stageRef.current;
    const pointer = stage?.getPointerPosition();
    if (!pointer) return { x: 160, y: 160 };
    return {
      x: (pointer.x - stagePos.x) / stageScale,
      y: (pointer.y - stagePos.y) / stageScale
    };
  }

  function handleDrop(event: React.DragEvent) {
    if (readonly) return;
    event.preventDefault();
    const type = event.dataTransfer.getData("device/type") as DeviceType;
    if (!type) return;
    const stage = stageRef.current;
    stage?.setPointersPositions(event);
    const point = getPointerOnPlan();
    onAddDevice(type, clamp(point.x, 30, CANVAS_WIDTH - 30), clamp(point.y, 30, CANVAS_HEIGHT - 30));
  }

  function handleWheel(event: Konva.KonvaEventObject<WheelEvent>) {
    event.evt.preventDefault();
    const stage = stageRef.current;
    const pointer = stage?.getPointerPosition();
    if (!stage || !pointer) return;
    const scaleBy = 1.06;
    const oldScale = stageScale;
    const mousePointTo = {
      x: (pointer.x - stagePos.x) / oldScale,
      y: (pointer.y - stagePos.y) / oldScale
    };
    const nextScale = clamp(event.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy, 0.35, 2.4);
    setStageScale(nextScale);
    setStagePos({
      x: pointer.x - mousePointTo.x * nextScale,
      y: pointer.y - mousePointTo.y * nextScale
    });
  }

  function handleDrawStart() {
    if (readonly || drawingTool === "select") return;
    const point = getPointerOnPlan();
    setDraft({ startX: point.x, startY: point.y, x: point.x, y: point.y });
  }

  function handleDrawMove() {
    if (!draft || readonly || drawingTool === "select") return;
    const point = getPointerOnPlan();
    setDraft((current) => (current ? { ...current, x: point.x, y: point.y } : current));
  }

  function handleDrawEnd() {
    if (!draft || readonly || drawingTool === "select") return;
    const element = createPlanElementDraft(drawingTool, draft);
    setDraft(null);
    if (element) {
      onAddPlanElement(drawingTool === "wall" ? "wall" : "area", element);
    }
  }

  return (
    <div
      ref={wrapperRef}
      className="grid-paper h-full w-full overflow-hidden bg-ink-50"
      onDragOver={(event) => event.preventDefault()}
      onDrop={handleDrop}
    >
      <Stage
        ref={stageRef}
        width={size.width}
        height={size.height}
        x={stagePos.x}
        y={stagePos.y}
        scaleX={stageScale}
        scaleY={stageScale}
        draggable={!readonly && drawingTool === "select"}
        onDragEnd={(event) => setStagePos({ x: event.target.x(), y: event.target.y() })}
        onWheel={handleWheel}
        onMouseDown={handleDrawStart}
        onMouseMove={handleDrawMove}
        onMouseUp={handleDrawEnd}
        onTouchStart={handleDrawStart}
        onTouchMove={handleDrawMove}
        onTouchEnd={handleDrawEnd}
      >
        <Layer>
          <Group>
            <Rect width={CANVAS_WIDTH} height={CANVAS_HEIGHT} fill="#ffffff" stroke="#cfd7e6" strokeWidth={2} shadowBlur={18} shadowOpacity={0.08} />
            {image && image.naturalWidth > 0 && image.naturalHeight > 0 ? (
              <KonvaImage image={image} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} opacity={0.92} />
            ) : plan.sourceType === "mock" ? (
              <MockPlan plan={plan} />
            ) : (
              <BlankPlan plan={plan} />
            )}
            {planElements.map((element) => (
              <PlanElementNode key={element.id} element={element} />
            ))}
            {draft ? <DraftPlanElement tool={drawingTool} draft={draft} /> : null}
            {deviceClusters.map((cluster) => (
              cluster.devices.length === 1 ? (
                <DeviceNode
                  key={cluster.id}
                  device={cluster.devices[0]}
                  selected={cluster.devices[0].id === selectedDeviceId}
                  readonly={readonly}
                  onMoveDevice={(deviceId, x, y) => {
                    setExpandedClusterId(null);
                    onMoveDevice(deviceId, x, y);
                  }}
                  onSelectDevice={(deviceId) => {
                    setExpandedClusterId(null);
                    onSelectDevice(deviceId);
                  }}
                />
              ) : (
                <DeviceClusterNode
                  key={cluster.id}
                  cluster={cluster}
                  expanded={expandedClusterId === cluster.id}
                  selectedDeviceId={selectedDeviceId}
                  onToggle={() => setExpandedClusterId((current) => (current === cluster.id ? null : cluster.id))}
                  onSelectDevice={(deviceId) => {
                    setExpandedClusterId(null);
                    onSelectDevice(deviceId);
                  }}
                />
              )
            ))}
          </Group>
        </Layer>
      </Stage>
    </div>
  );
}

function BlankPlan({ plan }: { plan: FloorPlan }) {
  return (
    <Group>
      <Text
        text={plan.sourceType === "pdf" ? "PDF cargado como referencia" : "Plano en blanco"}
        x={72}
        y={32}
        fill="#687083"
        fontSize={18}
        fontStyle="bold"
      />
      <Rect x={70} y={70} width={980} height={570} fill="#ffffff" stroke="#dfe4ee" strokeWidth={2} dash={[12, 8]} />
      <Text
        text="Dibuja paredes y ambientes o sube una referencia"
        x={0}
        y={330}
        width={CANVAS_WIDTH}
        align="center"
        fill="#9aa4b5"
        fontSize={18}
      />
    </Group>
  );
}

function PlanElementNode({ element }: { element: PlanElement }) {
  if (element.type === "wall") {
    return <Line points={element.points ?? []} stroke="#121722" strokeWidth={6} lineCap="round" lineJoin="round" />;
  }

  return (
    <Group>
      <Rect
        x={element.x}
        y={element.y}
        width={element.width ?? 0}
        height={element.height ?? 0}
        fill="rgba(47, 109, 246, 0.05)"
        stroke="#2f6df6"
        strokeWidth={3}
        dash={[10, 7]}
      />
      <Text x={element.x + 12} y={element.y + 12} text={element.label ?? "Area"} fill="#2d3442" fontSize={14} fontStyle="bold" />
    </Group>
  );
}

function DraftPlanElement({
  tool,
  draft
}: {
  tool: PlanDrawingTool;
  draft: { startX: number; startY: number; x: number; y: number };
}) {
  if (tool === "wall") {
    return <Line points={[draft.startX, draft.startY, draft.x, draft.y]} stroke="#121722" strokeWidth={6} opacity={0.55} lineCap="round" />;
  }

  const rect = normalizeRect(draft.startX, draft.startY, draft.x, draft.y);
  return (
    <Rect
      x={rect.x}
      y={rect.y}
      width={rect.width}
      height={rect.height}
      fill="rgba(47, 109, 246, 0.08)"
      stroke="#2f6df6"
      strokeWidth={3}
      dash={[10, 7]}
      opacity={0.75}
    />
  );
}

function MockPlan({ plan }: { plan: FloorPlan }) {
  const rooms = [
    { x: 70, y: 70, w: 280, h: 190, label: "Recepcion" },
    { x: 350, y: 70, w: 340, h: 190, label: "Oficinas" },
    { x: 690, y: 70, w: 350, h: 300, label: "Deposito" },
    { x: 70, y: 260, w: 280, h: 260, label: "Administracion" },
    { x: 350, y: 260, w: 340, h: 260, label: "Sala tecnica" },
    { x: 70, y: 520, w: 970, h: 120, label: "Circulacion" }
  ];

  return (
    <Group>
      <Text text={plan.sourceType === "pdf" ? "PDF cargado como referencia" : plan.name} x={72} y={32} fill="#687083" fontSize={18} fontStyle="bold" />
      {rooms.map((room) => (
        <Group key={room.label}>
          <Rect x={room.x} y={room.y} width={room.w} height={room.h} fill="#fbfcff" stroke="#aeb9cc" strokeWidth={3} />
          <Text x={room.x + 18} y={room.y + 18} text={room.label} fill="#687083" fontSize={16} fontStyle="bold" />
        </Group>
      ))}
      <Line points={[350, 520, 350, 640]} stroke="#aeb9cc" strokeWidth={5} />
      <Line points={[690, 260, 690, 370]} stroke="#aeb9cc" strokeWidth={5} />
    </Group>
  );
}

function DeviceNode({
  device,
  selected,
  readonly,
  onMoveDevice,
  onSelectDevice
}: {
  device: Device;
  selected: boolean;
  readonly?: boolean;
  onMoveDevice: (deviceId: string, x: number, y: number) => void;
  onSelectDevice: (deviceId: string) => void;
}) {
  return (
    <Group
      x={device.x}
      y={device.y}
      draggable={!readonly}
      onClick={() => onSelectDevice(device.id)}
      onTap={() => onSelectDevice(device.id)}
      onDragEnd={(event) => onMoveDevice(device.id, event.target.x(), event.target.y())}
    >
      <DeviceIcon device={device} selected={selected} />
    </Group>
  );
}

function DeviceClusterNode({
  cluster,
  expanded,
  selectedDeviceId,
  onToggle,
  onSelectDevice
}: {
  cluster: DeviceCluster;
  expanded: boolean;
  selectedDeviceId?: string;
  onToggle: () => void;
  onSelectDevice: (deviceId: string) => void;
}) {
  const selected = cluster.devices.some((device) => device.id === selectedDeviceId);
  const rows = cluster.devices.slice(0, 8);
  const popupWidth = 190;
  const rowHeight = 30;
  const popupHeight = rows.length * rowHeight + 16;

  return (
    <Group x={cluster.x} y={cluster.y}>
      <Group
        onClick={(event) => {
          event.cancelBubble = true;
          onToggle();
        }}
        onTap={(event) => {
          event.cancelBubble = true;
          onToggle();
        }}
      >
        <Circle radius={28} fill="#121722" stroke={selected ? "#2f6df6" : "#ffffff"} strokeWidth={selected ? 5 : 3} shadowBlur={14} shadowOpacity={0.22} />
        <Circle radius={20} fill="#ffffff" opacity={0.12} />
        <Text text={String(cluster.devices.length)} x={-14} y={-9} width={28} align="center" fill="#ffffff" fontSize={16} fontStyle="bold" />
      </Group>

      {expanded ? (
        <Group x={34} y={-Math.max(24, popupHeight / 2)}>
          <Rect width={popupWidth} height={popupHeight} fill="#ffffff" stroke="#dfe4ee" strokeWidth={1} cornerRadius={8} shadowBlur={18} shadowOpacity={0.18} />
          {rows.map((device, index) => (
            <Group
              key={device.id}
              x={8}
              y={8 + index * rowHeight}
              onClick={(event) => {
                event.cancelBubble = true;
                onSelectDevice(device.id);
              }}
              onTap={(event) => {
                event.cancelBubble = true;
                onSelectDevice(device.id);
              }}
            >
              <Rect
                width={popupWidth - 16}
                height={rowHeight - 2}
                fill={device.id === selectedDeviceId ? "#edf0f6" : "#ffffff"}
                cornerRadius={5}
              />
              <Circle x={13} y={14} radius={5} fill={layerColors[device.layer]} />
              <Text text={device.name || getDeviceLabel(device.type)} x={28} y={7} width={popupWidth - 52} fill="#121722" fontSize={11} ellipsis />
            </Group>
          ))}
        </Group>
      ) : null}
    </Group>
  );
}

function DeviceIcon({ device, selected }: { device: Device; selected: boolean }) {
  const color = layerColors[device.layer];

  return (
    <Group>
      <Circle radius={selected ? 22 : 18} fill={color} stroke={selected ? "#121722" : "#ffffff"} strokeWidth={selected ? 4 : 3} shadowBlur={10} shadowOpacity={0.16} />
      {device.type === "camera" ? (
        <Group>
          <Rect x={-9} y={-6} width={16} height={12} fill="#ffffff" cornerRadius={3} />
          <Line points={[7, -2, 12, -6, 12, 6, 7, 2]} closed fill="#ffffff" />
          <Circle radius={3} fill={color} />
        </Group>
      ) : null}
      {device.type === "reader" ? (
        <Group>
          <Rect x={-7} y={-10} width={14} height={20} fill="#ffffff" cornerRadius={3} />
          <Line points={[-3, -5, 3, -5]} stroke={color} strokeWidth={2} lineCap="round" />
          <Line points={[-3, 0, 3, 0]} stroke={color} strokeWidth={2} lineCap="round" />
          <Circle y={6} radius={2} fill={color} />
        </Group>
      ) : null}
      {device.type === "sensor" ? (
        <Group>
          <Circle radius={7} fill="#ffffff" />
          <Circle radius={3} fill={color} />
          <Line points={[-11, -1, -14, -4, -14, 4, -11, 1]} stroke="#ffffff" strokeWidth={2} lineCap="round" />
          <Line points={[11, -1, 14, -4, 14, 4, 11, 1]} stroke="#ffffff" strokeWidth={2} lineCap="round" />
        </Group>
      ) : null}
      {device.type === "rack" ? (
        <Group>
          <Rect x={-8} y={-11} width={16} height={22} fill="#ffffff" cornerRadius={2} />
          <Line points={[-5, -5, 5, -5]} stroke={color} strokeWidth={2} />
          <Line points={[-5, 0, 5, 0]} stroke={color} strokeWidth={2} />
          <Line points={[-5, 5, 5, 5]} stroke={color} strokeWidth={2} />
        </Group>
      ) : null}
      {device.type === "switch" ? (
        <Group>
          <Rect x={-11} y={-7} width={22} height={14} fill="#ffffff" cornerRadius={3} />
          {[-6, 0, 6].map((x) => (
            <Rect key={x} x={x - 2} y={-2} width={4} height={4} fill={color} cornerRadius={1} />
          ))}
        </Group>
      ) : null}
      {device.type === "ups" ? (
        <Group>
          <Rect x={-8} y={-10} width={16} height={20} fill="#ffffff" cornerRadius={3} />
          <Line points={[0, -6, -4, 1, 1, 1, -2, 7, 5, -2, 0, -2]} stroke={color} strokeWidth={2} lineJoin="round" lineCap="round" />
        </Group>
      ) : null}
      {device.type === "nvr" ? (
        <Group>
          <Rect x={-11} y={-8} width={22} height={16} fill="#ffffff" cornerRadius={3} />
          <Circle x={-5} radius={2} fill={color} />
          <Circle x={1} radius={2} fill={color} />
          <Line points={[5, -3, 9, 0, 5, 3]} stroke={color} strokeWidth={2} lineCap="round" lineJoin="round" />
        </Group>
      ) : null}
    </Group>
  );
}

interface DeviceCluster {
  id: string;
  x: number;
  y: number;
  devices: Device[];
}

function clusterDevices(devices: Device[]): DeviceCluster[] {
  const clusters: DeviceCluster[] = [];

  for (const device of devices) {
    const cluster = clusters.find((item) => Math.hypot(item.x - device.x, item.y - device.y) <= CLUSTER_DISTANCE);
    if (cluster) {
      cluster.devices.push(device);
      cluster.x = cluster.devices.reduce((sum, item) => sum + item.x, 0) / cluster.devices.length;
      cluster.y = cluster.devices.reduce((sum, item) => sum + item.y, 0) / cluster.devices.length;
    } else {
      clusters.push({ id: device.id, x: device.x, y: device.y, devices: [device] });
    }
  }

  return clusters.map((cluster) => ({
    ...cluster,
    id: cluster.devices.map((device) => device.id).sort().join("-")
  }));
}

function getDeviceLabel(type: DeviceType) {
  return deviceCatalog.find((item) => item.type === type)?.label ?? "Dispositivo";
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function createPlanElementDraft(
  tool: PlanDrawingTool,
  draft: { startX: number; startY: number; x: number; y: number }
): Omit<PlanElement, "id" | "projectId" | "planId" | "type"> | null {
  if (tool === "wall") {
    const distance = Math.hypot(draft.x - draft.startX, draft.y - draft.startY);
    if (distance < 12) return null;
    return {
      x: draft.startX,
      y: draft.startY,
      points: [draft.startX, draft.startY, draft.x, draft.y]
    };
  }

  if (tool === "area") {
    const rect = normalizeRect(draft.startX, draft.startY, draft.x, draft.y);
    if (rect.width < 16 || rect.height < 16) return null;
    return {
      ...rect,
      label: "Ambiente"
    };
  }

  return null;
}

function normalizeRect(startX: number, startY: number, x: number, y: number) {
  return {
    x: Math.min(startX, x),
    y: Math.min(startY, y),
    width: Math.abs(x - startX),
    height: Math.abs(y - startY)
  };
}
