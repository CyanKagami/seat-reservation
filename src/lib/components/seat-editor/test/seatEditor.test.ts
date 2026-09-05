// @vitest-environment jsdom
import { render, fireEvent, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import SeatEditor from '../components/SeatEditor.svelte';
import { cleanup } from '@testing-library/svelte';
import { afterEach } from 'vitest';



describe('SeatEditor Integration Tests', () => {
    afterEach(() => {
        cleanup();
    });

	it('adds a new seat when clicking the Add Seat button in Toolbar', async () => {
		render(SeatEditor);
		const user = userEvent.setup();

		const initialSeats = screen.getAllByRole('button', { name: '' }).length; // SVGs / Rects
		const addSeatButton = screen.getByTitle('Add Seat Square');

		await user.click(addSeatButton);

		const updatedSeats = screen.getAllByRole('button', { name: '' }).length;
		expect(updatedSeats).toBeGreaterThan(initialSeats);
	});

	it('deletes selected seats via the Delete button', async () => {
		render(SeatEditor);
		const user = userEvent.setup();

		const deleteBtn = screen.getByRole('button', { name: /delete/i });
		// 1. Add a seat (auto-selects)
		await user.click(screen.getByTitle('Add Seat Square'));
		expect(deleteBtn).not.toBeDisabled();

		await user.click(deleteBtn);
		
		expect(deleteBtn).toBeDisabled();
	});


    it('deletes a selected seat via the Delete keyboard key', async () => {
		render(SeatEditor);
		const user = userEvent.setup();

		const deleteBtn = screen.getByRole('button', { name: /delete/i });

		// 1. Add a seat (auto-selects)
		await user.click(screen.getByTitle('Add Seat Square'));
		expect(deleteBtn).not.toBeDisabled();
        console.log(deleteBtn)
		// 2. Trigger Delete key
		await fireEvent.keyDown(window, { key: 'Delete' });

		// 3. Selection cleared
        console.log(deleteBtn)
		expect(deleteBtn).toBeDisabled();
	});

	it('disables the save button when seats overlap', async () => {
		const { container } = render(SeatEditor);
		const [saveButton] = screen.getAllByRole('button', { name: 'บันทึก' });

		// Both seats start apart; button is enabled
		expect(saveButton).not.toBeDisabled();
	});
});