export function DataTable({ columns = [], rows = [], onRowClick, emptyMessage = 'No data found' }) {
	const hasRows = Array.isArray(rows) && rows.length > 0;
	const columnCount = Math.max(columns.length, 1);

	return (
		<div className="overflow-x-auto w-full">
			<table className="w-full text-sm border-collapse">
				<thead>
					<tr className="bg-[#F5F0E8] text-[#1A1A1A] font-semibold border-b-2 border-[#1A1A1A]">
						{columns.map((column) => (
							<th
								key={column.key}
								className={`px-4 py-3 text-left ${column.numeric ? 'text-right font-mono' : ''}`.trim()}
							>
								{column.label}
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{!hasRows ? (
						<tr className="border-b border-[#E5E7EB]">
							<td className="px-4 py-6 text-center text-[#6B7280]" colSpan={columnCount}>
								{emptyMessage}
							</td>
						</tr>
					) : (
						rows.map((row, rowIndex) => {
							const rowKey = row?.id ?? row?.key ?? rowIndex;
							const clickable = typeof onRowClick === 'function';

							return (
								<tr
									key={rowKey}
									className={`border-b border-[#E5E7EB] ${clickable ? 'hover:bg-[#F9F6F0] cursor-pointer' : ''}`.trim()}
									onClick={clickable ? () => onRowClick(row) : undefined}
								>
									{columns.map((column) => {
										const value = row?.[column.key];
										const content = column.render ? column.render(value, row) : value;

										return (
											<td
												key={column.key}
												className={`px-4 py-3 ${column.numeric ? 'text-right font-mono' : ''}`.trim()}
											>
												{content}
											</td>
										);
									})}
								</tr>
							);
						})
					)}
				</tbody>
			</table>
		</div>
	);
}

export default DataTable;
