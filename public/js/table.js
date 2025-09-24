// table.js
import { applyFilters } from './filters.js';

export function renderTable(rows, pageSize, currentPage) {
  const data = applyFilters(rows);
  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  const pageRows = data.slice(start, end);

  const tbody = document.getElementById('tbody');
  tbody.innerHTML = pageRows.map(r => {
    const badge = r.status === 'done'
      ? '<span class="badge green">已完成</span>'
      : '<span class="badge gray">未完成</span>';
    return `
      <tr>
        <td name="patient_id">${r.patient_id}</td>
        <td name="created_at">${r.created_at.split("T")[0] ?? ''}</td>
        <td name="updated_at">${r.updated_at.split("T")[0] ?? ''}</td>
        <td name="name">${r.name}</td>
        <td name="badge">${badge}</td>
        <td name="notes">${r.notes || ''}</td>
        <td>
          <button type="button" class="view_btn btn btn-sm btn-primary" name="view_btn"
                  data-bs-toggle="modal" data-bs-target="#viewAllRecordModal"
                  data-f-createtime="${r.created_at.split("T")[0] ?? ''}"
                  data-f-case="${r.patient_id ?? ''}"
                  data-f-uploadtime="${r.updated_at.split("T")[0] ?? ''}"
                  data-f-user="${r.name ?? ''}"
                  data-f-status="${r.status ?? ''}"
                  data-f-notes="${r.notes ?? ''}">
            查看
          </button>
        </td>
      </tr>`;
  }).join('');
};
