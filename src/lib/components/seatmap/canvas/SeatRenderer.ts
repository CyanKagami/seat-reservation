import Konva from 'konva';
import type { Seat } from '../types';
import { SEAT_STATUS_COLORS, SEAT_STROKE_COLOR, SEAT_STROKE_WIDTH, SEAT_LABEL_FONT_SIZE, SEAT_LABEL_COLOR } from '../constants';

const SHAPE_NODE_NAME = 'seat-shape';
const LABEL_NODE_NAME = 'seat-label';

function seatLabelText(seat: Seat): string {
	if (seat.label) return seat.label;
	if (seat.row && seat.seatNumber) return `${seat.row}${seat.seatNumber}`;
	if (seat.seatNumber) return seat.seatNumber;
	return '';
}

function createShapeNode(seat: Seat): Konva.Shape {
	const fill = SEAT_STATUS_COLORS[seat.status];

	if (seat.shape === 'circle') {
		return new Konva.Circle({
			name: SHAPE_NODE_NAME,
			radius: seat.width / 2,
			fill,
			stroke: SEAT_STROKE_COLOR,
			strokeWidth: SEAT_STROKE_WIDTH
		});
	}

	return new Konva.Rect({
		name: SHAPE_NODE_NAME,
		x: -seat.width / 2,
		y: -seat.height / 2,
		width: seat.width,
		height: seat.height,
		cornerRadius: 3,
		fill,
		stroke: SEAT_STROKE_COLOR,
		strokeWidth: SEAT_STROKE_WIDTH
	});
}

function createLabelNode(seat: Seat): Konva.Text {
	return new Konva.Text({
		name: LABEL_NODE_NAME,
		text: seatLabelText(seat),
		fontSize: SEAT_LABEL_FONT_SIZE,
		fill: SEAT_LABEL_COLOR,
		width: seat.width,
		height: seat.height,
		x: -seat.width / 2,
		y: -seat.height / 2,
		align: 'center',
		verticalAlign: 'middle',
		listening: false
	});
}

/** One Konva.Group per seat: a shape (circle/rect) plus a centered label, positioned/rotated as a unit. */
export function createSeatNode(seat: Seat): Konva.Group {
	const group = new Konva.Group({
		id: seat.id,
		name: 'seat',
		x: seat.x,
		y: seat.y,
		rotation: seat.rotation
	});

	group.add(createShapeNode(seat));
	group.add(createLabelNode(seat));

	return group;
}

/**
 * Mutates an existing Konva node in place to match `seat`'s current data,
 * rather than destroying and recreating it — this is what makes the scene
 * sync (see `SceneSync.ts`) cheap at 1000+ seats on every store update.
 */
export function updateSeatNode(group: Konva.Group, seat: Seat): void {
	group.position({ x: seat.x, y: seat.y });
	group.rotation(seat.rotation);

	let shape = group.findOne<Konva.Shape>(`.${SHAPE_NODE_NAME}`);
	const wrongShapeType = shape && ((seat.shape === 'circle') !== shape instanceof Konva.Circle);

	// A shape's fundamental type (circle vs rect) can't be morphed in place —
	// if the seat's `shape` field changed since last render, swap the node.
	if (!shape || wrongShapeType) {
		shape?.destroy();
		shape = createShapeNode(seat);
		group.add(shape);
	} else {
		shape.fill(SEAT_STATUS_COLORS[seat.status]);
		if (shape instanceof Konva.Circle) {
			shape.radius(seat.width / 2);
		} else {
			shape.width(seat.width);
			shape.height(seat.height);
			shape.x(-seat.width / 2);
			shape.y(-seat.height / 2);
		}
	}

	const label = group.findOne<Konva.Text>(`.${LABEL_NODE_NAME}`);
	if (label) {
		label.text(seatLabelText(seat));
		label.width(seat.width);
		label.height(seat.height);
		label.x(-seat.width / 2);
		label.y(-seat.height / 2);
	}
}
