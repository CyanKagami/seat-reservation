import { BaseToolStrategy } from './BaseToolStrategy';
import type { ToolContext } from './types';
import { BOX_SIZE } from '../constants';

export class SingleSeatToolStrategy extends BaseToolStrategy {
	readonly id = 'add-square';

	override onMouseDown({ state, canvasPoint }: ToolContext) {
		const posX = Math.max(0, canvasPoint.x - BOX_SIZE / 2);
		const posY = Math.max(0, canvasPoint.y - BOX_SIZE / 2);

		const newSeat = this.createSeatObject(state.objects.length + 1, posX, posY);

		state.objects = [...state.objects, newSeat];
		state.selectedIds = new Set([newSeat.id]);
	}
}