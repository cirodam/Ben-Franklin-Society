<script lang="ts">
	import type { BudgetDocument, LineItem } from '@bfs/types';
	import Document from './Document.svelte';

	let { 
		budget, 
		mode = 'view', 
		onChange,
		readonly = false 
	}: {
		budget: BudgetDocument;
		mode?: 'view' | 'edit';
		onChange?: (updates: Partial<BudgetDocument>) => void;
		readonly?: boolean;
	} = $props();

	// Local editable state
	let title = $state(budget.title);
	let fiscalYear = $state(budget.content.fiscal_year);
	let period = $state(budget.content.period);
	let lineItems = $state<LineItem[]>(structuredClone($state.snapshot(budget.content.line_items)));

	const isEditMode = $derived(mode === 'edit' && !readonly);

	// Calculate totals
	const totalRevenue = $derived(
		lineItems
			.filter(item => item.type === 'revenue')
			.reduce((sum, item) => sum + item.amount, 0)
	);

	const totalExpenses = $derived(
		lineItems
			.filter(item => item.type === 'expense')
			.reduce((sum, item) => sum + item.amount, 0)
	);

	const netBalance = $derived(totalRevenue - totalExpenses);

	// Edit functions
	function handleTitleChange(e: Event) {
		const input = e.target as HTMLInputElement;
		title = input.value;
		emitChange();
	}

	function handleFiscalYearChange(e: Event) {
		const input = e.target as HTMLInputElement;
		fiscalYear = parseInt(input.value);
		emitChange();
	}

	function handlePeriodChange(e: Event) {
		const select = e.target as HTMLSelectElement;
		period = select.value as 'annual' | 'quarterly' | 'monthly';
		emitChange();
	}

	function addLineItem(type: 'revenue' | 'expense') {
		lineItems = [...lineItems, {
			category: '',
			description: '',
			amount: 0,
			type
		}];
		emitChange();
	}

	function removeLineItem(index: number) {
		lineItems = lineItems.filter((_, i) => i !== index);
		emitChange();
	}

	function updateLineItem(index: number, field: keyof LineItem, value: string | number) {
		lineItems[index] = { ...lineItems[index], [field]: value };
		emitChange();
	}

	function emitChange() {
		if (onChange) {
			onChange({
				title,
				content: {
					...budget.content,
					fiscal_year: fiscalYear,
					period,
					line_items: lineItems,
					total_revenue: totalRevenue,
					total_expenses: totalExpenses
				}
			});
		}
	}

	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 2
		}).format(amount);
	}
</script>

<Document 
	documentId={budget.document_id || `#${budget.uuid.slice(0, 8)}`}
	title={isEditMode ? '' : title}
>
	{#snippet header()}
		{#if isEditMode}
			<input
				type="text"
				value={title}
				oninput={handleTitleChange}
				class="title-input"
				placeholder="Budget title"
			/>

			<div class="budget-meta-edit">
				<div class="field-group">
					<label class="field-label" for="fiscalYear">Fiscal Year</label>
					<input
						id="fiscalYear"
						type="number"
						value={fiscalYear}
						oninput={handleFiscalYearChange}
						class="year-input"
						min="2000"
						max="2100"
					/>
				</div>

				<div class="field-group">
					<label class="field-label" for="period">Period</label>
					<select
						id="period"
						value={period}
						onchange={handlePeriodChange}
						class="period-select"
					>
						<option value="annual">Annual</option>
						<option value="quarterly">Quarterly</option>
						<option value="monthly">Monthly</option>
					</select>
				</div>
			</div>
		{:else}
			<div class="budget-meta">
				<div class="meta-item">
					<span class="meta-label">Fiscal Year:</span>
					<span class="meta-value">{budget.content.fiscal_year}</span>
				</div>
				<div class="meta-item">
					<span class="meta-label">Period:</span>
					<span class="meta-value">{budget.content.period}</span>
				</div>
			</div>
		{/if}

		{#if budget.content.approved_at}
			<div class="approval-info">
				<span class="approval-label">Approved:</span>
				<span class="approval-value">
					{new Date(budget.content.approved_at).toLocaleDateString('en-US', {
						year: 'numeric',
						month: 'long',
						day: 'numeric'
					})}
				</span>
			</div>
		{/if}
	{/snippet}

	<div class="budget-body">
		<!-- Revenue Section -->
		<div class="budget-section">
			<h2 class="section-heading">Revenue</h2>

			<div class="line-items">
				{#each lineItems.filter(item => item.type === 'revenue') as item, index}
					{@const actualIndex = lineItems.indexOf(item)}
					<div class="line-item" class:line-item--edit={isEditMode}>
						{#if isEditMode}
							<div class="line-item-edit">
								<input
									type="text"
									value={item.category}
									oninput={(e) => updateLineItem(actualIndex, 'category', (e.target as HTMLInputElement).value)}
									class="category-input"
									placeholder="Category"
								/>
								<input
									type="text"
									value={item.description}
									oninput={(e) => updateLineItem(actualIndex, 'description', (e.target as HTMLInputElement).value)}
									class="description-input"
									placeholder="Description"
								/>
								<input
									type="number"
									value={item.amount}
									oninput={(e) => updateLineItem(actualIndex, 'amount', parseFloat((e.target as HTMLInputElement).value) || 0)}
									class="amount-input"
									placeholder="0.00"
									step="0.01"
									min="0"
								/>
								<button
									type="button"
									class="btn-delete-item"
									onclick={() => removeLineItem(actualIndex)}
									title="Delete item"
								>
									×
								</button>
							</div>
						{:else}
							<div class="line-item-view">
								<div class="item-info">
									<div class="item-category">{item.category}</div>
									<div class="item-description">{item.description}</div>
								</div>
								<div class="item-amount revenue">{formatCurrency(item.amount)}</div>
							</div>
						{/if}
					</div>
				{/each}

				{#if isEditMode}
					<button
						type="button"
						class="btn-add-item"
						onclick={() => addLineItem('revenue')}
					>
						+ Add Revenue Item
					</button>
				{/if}
			</div>

			{#if !isEditMode}
				<div class="section-total">
					<span class="total-label">Total Revenue:</span>
					<span class="total-amount revenue">{formatCurrency(totalRevenue)}</span>
				</div>
			{/if}
		</div>

		<!-- Expenses Section -->
		<div class="budget-section">
			<h2 class="section-heading">Expenses</h2>

			<div class="line-items">
				{#each lineItems.filter(item => item.type === 'expense') as item, index}
					{@const actualIndex = lineItems.indexOf(item)}
					<div class="line-item" class:line-item--edit={isEditMode}>
						{#if isEditMode}
							<div class="line-item-edit">
								<input
									type="text"
									value={item.category}
									oninput={(e) => updateLineItem(actualIndex, 'category', (e.target as HTMLInputElement).value)}
									class="category-input"
									placeholder="Category"
								/>
								<input
									type="text"
									value={item.description}
									oninput={(e) => updateLineItem(actualIndex, 'description', (e.target as HTMLInputElement).value)}
									class="description-input"
									placeholder="Description"
								/>
								<input
									type="number"
									value={item.amount}
									oninput={(e) => updateLineItem(actualIndex, 'amount', parseFloat((e.target as HTMLInputElement).value) || 0)}
									class="amount-input"
									placeholder="0.00"
									step="0.01"
									min="0"
								/>
								<button
									type="button"
									class="btn-delete-item"
									onclick={() => removeLineItem(actualIndex)}
									title="Delete item"
								>
									×
								</button>
							</div>
						{:else}
							<div class="line-item-view">
								<div class="item-info">
									<div class="item-category">{item.category}</div>
									<div class="item-description">{item.description}</div>
								</div>
								<div class="item-amount expense">{formatCurrency(item.amount)}</div>
							</div>
						{/if}
					</div>
				{/each}

				{#if isEditMode}
					<button
						type="button"
						class="btn-add-item"
						onclick={() => addLineItem('expense')}
					>
						+ Add Expense Item
					</button>
				{/if}
			</div>

			{#if !isEditMode}
				<div class="section-total">
					<span class="total-label">Total Expenses:</span>
					<span class="total-amount expense">{formatCurrency(totalExpenses)}</span>
				</div>
			{/if}
		</div>

		<!-- Net Balance -->
		<div class="net-balance">
			<div class="balance-row">
				<span class="balance-label">Net Balance:</span>
				<span class="balance-amount" class:positive={netBalance >= 0} class:negative={netBalance < 0}>
					{formatCurrency(netBalance)}
				</span>
			</div>
		</div>
	</div>
</Document>

<style>
	/* Title editing */
	.title-input {
		font-family: 'IM Fell English', serif;
		font-size: clamp(2rem, 5vw, 3rem);
		font-weight: 400;
		line-height: 1.15;
		color: #151c1a;
		margin: var(--space-8, 2rem) 0 var(--space-5, 1.25rem);
		text-align: center;
		letter-spacing: -0.01em;
		width: 100%;
		border: 2px dashed rgba(45, 90, 79, 0.2);
		background: rgba(255, 255, 255, 0.3);
		padding: var(--space-2, 0.5rem);
		border-radius: 4px;
	}

	.title-input:focus {
		outline: none;
		border-color: rgba(45, 90, 79, 0.4);
		background: rgba(255, 255, 255, 0.6);
	}

	/* Budget metadata */
	.budget-meta,
	.budget-meta-edit {
		display: flex;
		gap: var(--space-6, 1.5rem);
		justify-content: center;
		margin-top: var(--space-4, 1rem);
	}

	.meta-item {
		display: flex;
		gap: var(--space-2, 0.5rem);
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-sm, 0.875rem);
	}

	.meta-label {
		font-weight: 600;
		font-style: italic;
		color: #5a5a50;
	}

	.meta-value {
		color: #2d2d28;
		text-transform: capitalize;
	}

	.field-group {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-2, 0.5rem);
	}

	.field-label {
		font-family: 'IM Fell English SC', serif;
		font-size: var(--text-xs, 0.75rem);
		letter-spacing: 0.08em;
		color: #2d5a4f;
		font-weight: 600;
		text-transform: uppercase;
	}

	.year-input,
	.period-select {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-sm, 0.875rem);
		padding: var(--space-2, 0.5rem);
		border: 1px solid rgba(45, 90, 79, 0.25);
		background: white;
		border-radius: 4px;
	}

	.year-input:focus,
	.period-select:focus {
		outline: none;
		border-color: rgba(45, 90, 79, 0.5);
	}

	.approval-info {
		display: flex;
		gap: var(--space-2, 0.5rem);
		justify-content: center;
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-sm, 0.875rem);
		margin-top: var(--space-3, 0.75rem);
		color: #2e7d32;
	}

	.approval-label {
		font-weight: 600;
	}

	/* Budget sections */
	.budget-section {
		margin-bottom: var(--space-10, 2.5rem);
	}

	.section-heading {
		font-family: 'IM Fell English', serif;
		font-size: 1.75rem;
		font-weight: 400;
		color: #2d2d28;
		margin: 0 0 var(--space-6, 1.5rem) 0;
		padding-bottom: var(--space-4, 1rem);
		border-bottom: 2px solid rgba(45, 90, 79, 0.2);
	}

	/* Line items */
	.line-items {
		display: flex;
		flex-direction: column;
		gap: var(--space-3, 0.75rem);
	}

	.line-item {
		padding: var(--space-3, 0.75rem);
		background: rgba(255, 255, 255, 0.5);
		border: 1px solid rgba(45, 90, 79, 0.1);
		border-radius: 4px;
	}

	.line-item--edit {
		background: rgba(255, 255, 255, 0.3);
		border: 2px dashed rgba(45, 90, 79, 0.15);
	}

	.line-item-edit {
		display: grid;
		grid-template-columns: 1fr 2fr 1fr auto;
		gap: var(--space-2, 0.5rem);
		align-items: center;
	}

	.category-input,
	.description-input,
	.amount-input {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-sm, 0.875rem);
		padding: var(--space-2, 0.5rem);
		border: 1px solid rgba(45, 90, 79, 0.25);
		background: white;
		border-radius: 4px;
	}

	.category-input:focus,
	.description-input:focus,
	.amount-input:focus {
		outline: none;
		border-color: rgba(45, 90, 79, 0.5);
	}

	.btn-delete-item {
		width: 1.75rem;
		height: 1.75rem;
		border: 1px solid rgba(211, 47, 47, 0.3);
		background: white;
		color: #c62828;
		border-radius: 4px;
		cursor: pointer;
		font-size: 1.25rem;
		line-height: 1;
		padding: 0;
		transition: all 0.15s;
	}

	.btn-delete-item:hover {
		background: rgba(211, 47, 47, 0.1);
		border-color: #c62828;
	}

	.line-item-view {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.item-info {
		flex: 1;
	}

	.item-category {
		font-family: 'IM Fell English SC', serif;
		font-size: var(--text-sm, 0.875rem);
		font-weight: 600;
		letter-spacing: 0.05em;
		color: #2d5a4f;
		text-transform: uppercase;
	}

	.item-description {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: var(--text-sm, 0.875rem);
		color: #5a5a50;
		margin-top: var(--space-1, 0.25rem);
	}

	.item-amount {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: 1.125rem;
		font-weight: 600;
		white-space: nowrap;
	}

	.item-amount.revenue {
		color: #2e7d32;
	}

	.item-amount.expense {
		color: #c62828;
	}

	.btn-add-item {
		display: block;
		margin: var(--space-4, 1rem) auto 0;
		padding: var(--space-2, 0.5rem) var(--space-4, 1rem);
		border: 2px dashed rgba(45, 90, 79, 0.3);
		background: rgba(255, 255, 255, 0.5);
		color: #2d5a4f;
		border-radius: 4px;
		cursor: pointer;
		font-size: var(--text-sm, 0.875rem);
		font-weight: 600;
		transition: all 0.15s;
	}

	.btn-add-item:hover {
		background: rgba(45, 90, 79, 0.05);
		border-color: #2d5a4f;
	}

	.section-total {
		display: flex;
		justify-content: flex-end;
		align-items: center;
		gap: var(--space-4, 1rem);
		margin-top: var(--space-6, 1.5rem);
		padding-top: var(--space-4, 1rem);
		border-top: 2px solid rgba(45, 90, 79, 0.2);
	}

	.total-label {
		font-family: 'IM Fell English SC', serif;
		font-size: var(--text-base, 1rem);
		font-weight: 600;
		letter-spacing: 0.05em;
		color: #2d2d28;
	}

	.total-amount {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: 1.5rem;
		font-weight: 600;
	}

	.total-amount.revenue {
		color: #2e7d32;
	}

	.total-amount.expense {
		color: #c62828;
	}

	/* Net balance */
	.net-balance {
		margin-top: var(--space-8, 2rem);
		padding: var(--space-6, 1.5rem);
		background: rgba(45, 90, 79, 0.05);
		border: 2px solid rgba(45, 90, 79, 0.2);
		border-radius: 8px;
	}

	.balance-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.balance-label {
		font-family: 'IM Fell English', serif;
		font-size: 1.5rem;
		font-weight: 600;
		color: #2d2d28;
	}

	.balance-amount {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: 2rem;
		font-weight: 700;
	}

	.balance-amount.positive {
		color: #2e7d32;
	}

	.balance-amount.negative {
		color: #c62828;
	}

	@media (max-width: 768px) {
		.line-item-edit {
			grid-template-columns: 1fr;
		}

		.budget-meta-edit {
			flex-direction: column;
		}
	}
</style>
