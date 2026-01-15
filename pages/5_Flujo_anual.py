from __future__ import annotations
from dataclasses import dataclass
from typing import Iterable, Literal, List, Dict


import pandas as pd
import streamlit as st
from datetime import date, timedelta
from pathlib import Path
import calendar
import plotly.graph_objects as go


Frequency = Literal["weekly", "biweekly", "monthly", "once"]
Kind = Literal["income", "expense", "investment"]

@dataclass
class Flow:
    """Single cash flow definition."""

    kind: Kind
    name: str
    amount: float  # positive value
    frequency: Frequency
    start_date: date
    end_date: date | None = None
    day_of_month: int | None = None  # for monthly schedules
    weekday: int | None = None  # 0=Monday
    notes: str = ""

st.set_page_config(page_title="Cashflow 2026", layout="wide")

FLOW_CSV_PATH = Path(__file__).parent.parent / "flow_data.csv"

def summarize_monthly(schedule: Iterable[Dict[str, object]]) -> Dict[int, Dict[str, float]]:
    """Monthly totals by kind, net total, net sin inversión, y flujo acumulado."""

    summary: Dict[int, Dict[str, float]] = {
        m: {"income": 0.0, "expense": 0.0, "investment": 0.0, "net": 0.0, "net_no_investment": 0.0, "acumulado": 0.0}
        for m in range(1, 13)
    }
    
    acumulado_total = 0.0
    
    for record in schedule:
        month = record["date"].month  # type: ignore[index]
        kind = record["kind"]  # type: ignore[index]
        amount = float(record["amount"])  # type: ignore[index]
        if kind == "income":
            summary[month]["income"] += amount
            summary[month]["net"] += amount
            summary[month]["net_no_investment"] += amount
        elif kind == "expense":
            summary[month]["expense"] += amount
            summary[month]["net"] -= amount
            summary[month]["net_no_investment"] -= amount
        elif kind == "investment":
            summary[month]["investment"] += amount
            summary[month]["net"] -= amount
        else:
            raise ValueError(f"Unknown kind: {kind}")
    
    # Calcular flujo acumulado
    for m in range(1, 13):
        acumulado_total += summary[m]["net"]
        summary[m]["acumulado"] = acumulado_total
    
    return summary

def _init_state() -> None:
    if "flows" not in st.session_state:
        st.session_state.flows = []  # list of dicts to keep Streamlit-friendly


def _flows_df() -> pd.DataFrame:
    return pd.DataFrame(st.session_state.flows)

def _generate_dates(flow: Flow, year: int) -> List[date]:
    """Return all occurrence dates for a flow in the given year."""

    dates: List[date] = []
    start = flow.start_date
    end = flow.end_date or date(year, 12, 31)

    if flow.frequency == "once":
        if start.year == year and start <= end:
            dates.append(start)
        return dates

    if flow.frequency in {"weekly", "biweekly"}:
        step = 7 if flow.frequency == "weekly" else 14
        current = start
        while current <= end:
            if current.year == year:
                dates.append(current)
            current += timedelta(days=step)
        return dates

    if flow.frequency == "monthly":
        anchor_day = flow.day_of_month or flow.start_date.day
        for month in range(1, 13):
            last_day = calendar.monthrange(year, month)[1]
            day = min(anchor_day, last_day)
            occurrence = date(year, month, day)
            if occurrence < start or occurrence > end:
                continue
            dates.append(occurrence)
        return dates

def build_schedule(flows: Iterable[Flow], year: int) -> List[Dict[str, object]]:
    """Expand flows into dated records for the target year."""

    schedule = []
    for flow in flows:
        for when in _generate_dates(flow, year):
            schedule.append(
                {
                    "date": when,
                    "kind": flow.kind,
                    "name": flow.name,
                    "amount": flow.amount,
                    "notes": flow.notes,
                }
            )
    schedule.sort(key=lambda r: r["date"])
    return schedule

def _save_flows_to_csv(path: Path = FLOW_CSV_PATH) -> None:
    df = _flows_df()
    if df.empty:
        return
    for col in ["start_date", "end_date"]:
        if col in df.columns:
            df[col] = pd.to_datetime(df[col]).dt.date.astype(str)
    df.to_csv(path, index=False)


def _load_flows_from_csv(path: Path = FLOW_CSV_PATH) -> None:
    if not path.exists():
        st.warning(f"No se encontró {path.name} todavía.")
        return
    df = pd.read_csv(path, parse_dates=["start_date", "end_date"], keep_default_na=True)
    records = []
    for _, row in df.iterrows():
        records.append(
            {
                "kind": row.get("kind", "income"),
                "name": row.get("name", ""),
                "amount": float(row.get("amount", 0.0)),
                "frequency": row.get("frequency", "monthly"),
                "start_date": row.get("start_date", pd.NaT).date() if pd.notna(row.get("start_date")) else date(2026, 1, 1),
                "end_date": row.get("end_date", pd.NaT).date() if pd.notna(row.get("end_date")) else None,
                "day_of_month": int(row.get("day_of_month")) if pd.notna(row.get("day_of_month")) else None,
                "notes": row.get("notes", ""),
            }
        )
    st.session_state.flows = records
    st.success(f"Cargado {len(records)} flujos desde {path.name}.")


def _add_flow(kind: str, name: str, amount: float, frequency: str, start_date: date, end_date: date | None, day_of_month: int | None, notes: str) -> None:
    st.session_state.flows.append(
        {
            "kind": kind,
            "name": name,
            "amount": amount,
            "frequency": frequency,
            "start_date": start_date,
            "end_date": end_date,
            "day_of_month": day_of_month,
            "notes": notes,
        }
    )


def _flows_as_models() -> list[Flow]:
    return [
        Flow(
            kind=f["kind"],
            name=f["name"],
            amount=float(f["amount"]),
            frequency=f["frequency"],
            start_date=f["start_date"],
            end_date=f.get("end_date"),
            day_of_month=f.get("day_of_month"),
            notes=f.get("notes", ""),
        )
        for f in st.session_state.flows
    ]


def _load_sample() -> None:
    st.session_state.flows = []
    _add_flow("income", "Salario bisemanal", 1500.0, "biweekly", date(2026, 1, 5), None, None, "Pago nómina cada 14 días")
    _add_flow("income", "Freelance semanal", 200.0, "weekly", date(2026, 1, 3), None, None, "")
    _add_flow("income", "Ingreso mensual", 800.0, "monthly", date(2026, 1, 1), None, 25, "")
    _add_flow("expense", "Renta", 900.0, "monthly", date(2026, 1, 1), None, 1, "")
    _add_flow("expense", "Servicios", 200.0, "monthly", date(2026, 1, 1), None, 10, "")
    _add_flow("expense", "Gastos semanales", 120.0, "weekly", date(2026, 1, 6), None, None, "")
    _add_flow("investment", "Aporte inversión", 300.0, "monthly", date(2026, 1, 1), None, 5, "")
    _add_flow("investment", "Inversión semanal", 100.0, "weekly", date(2026, 1, 4), None, None, "")


def sidebar_controls() -> tuple[int, bool]:
    with st.sidebar:
        st.header("Opciones")
        year = st.number_input("Año", min_value=2024, max_value=2100, value=2026, step=1)
        if st.button("Cargar ejemplo", help="Rellena con flujos de muestra"):
            _load_sample()
        if st.button("Limpiar flujos"):
            st.session_state.flows = []
        if st.button("Guardar flujos en CSV"):
            _save_flows_to_csv()
            st.success(f"Guardado en {FLOW_CSV_PATH.name}")
        if st.button("Cargar flujos desde CSV"):
            _load_flows_from_csv()
        expand_table = st.checkbox("Ver tabla completa", value=False)
    return int(year), bool(expand_table)


def flow_form() -> None:
    st.subheader("Agregar flujo")
    with st.form("add_flow_form", clear_on_submit=True):
        col1, col2, col3 = st.columns(3)
        with col1:
            kind = st.selectbox("Tipo", ["income", "expense", "investment"], index=0)
            frequency = st.selectbox("Frecuencia", ["weekly", "biweekly", "monthly", "once"], index=0)
            amount = st.number_input("Monto", min_value=0.0, value=0.0, step=50.0)
        with col2:
            name = st.text_input("Nombre", value="")
            start_date = st.date_input("Fecha inicio", value=date(2026, 1, 1))
            day_of_month = None
            if frequency == "monthly":
                day_of_month = st.number_input("Día del mes (para mensual)", min_value=1, max_value=31, value=start_date.day)
        with col3:
            open_end = st.checkbox("Sin fecha fin", value=True)
            end_date = None if open_end else st.date_input("Fecha fin", value=date(2026, 12, 31))
            notes = st.text_input("Notas", value="")

        submitted = st.form_submit_button("Agregar")
        if submitted:
            _add_flow(kind, name or "Sin nombre", amount, frequency, start_date, end_date, day_of_month, notes)
            st.success(f"Agregado: {name or 'Sin nombre'}")


def flows_table() -> None:
    st.subheader("Flujos cargados")
    if not st.session_state.flows:
        st.info("Aún no hay flujos. Usa el formulario o carga el ejemplo.")
        return

    df = _flows_df()
    df = df[["kind", "name", "amount", "frequency", "start_date", "end_date", "day_of_month", "notes"]]
    st.dataframe(df, use_container_width=True, hide_index=True)

    st.download_button(
        "Descargar flujos CSV",
        df.to_csv(index=False).encode("utf-8"),
        file_name=FLOW_CSV_PATH.name,
        mime="text/csv",
    )


def schedule_section(year: int, expand_table: bool) -> None:
    st.subheader("Calendario")
    flows = _flows_as_models()
    if not flows:
        st.info("Agrega flujos para ver el calendario.")
        return

    schedule = build_schedule(flows, year)
    df_sched = pd.DataFrame(schedule)
    df_sched["date"] = pd.to_datetime(df_sched["date"])

    if expand_table:
        st.dataframe(df_sched.sort_values("date"), use_container_width=True, hide_index=True)
    else:
        st.dataframe(df_sched.sort_values("date").head(25), use_container_width=True, hide_index=True)

    st.download_button(
        "Descargar calendario CSV",
        df_sched.to_csv(index=False).encode("utf-8"),
        file_name=f"cashflow_{year}_schedule.csv",
        mime="text/csv",
    )


def summary_section(year: int) -> None:
    st.subheader("Resumen mensual")
    flows = _flows_as_models()
    if not flows:
        st.info("Agrega flujos para ver el resumen.")
        return

    schedule = build_schedule(flows, year)
    summary = summarize_monthly(schedule)
    df_summary = pd.DataFrame(summary).T
    df_summary.index.name = "month"

    # Ordenar y renombrar para destacar netos y acumulado
    df_summary = df_summary[["income", "expense", "investment", "net", "net_no_investment", "acumulado"]]
    df_summary = df_summary.rename(columns={
        "net": "net_total", 
        "net_no_investment": "net_sin_inversion",
        "acumulado": "flujo_acumulado"
    })
    
    # Formatear para visualización
    df_display = df_summary.copy()
    for col in df_display.columns:
        df_display[col] = df_display[col].apply(lambda x: f"B/. {x:,.2f}")

    st.dataframe(df_display, use_container_width=True)

    st.download_button(
        "Descargar resumen CSV",
        df_summary.reset_index().to_csv(index=False).encode("utf-8"),
        file_name=f"cashflow_{year}_summary.csv",
        mime="text/csv",
    )
    
    # Gráfica de flujo acumulado
    st.subheader("📈 Flujo Acumulado Mensual")
    
    fig = go.Figure()
    
    # Línea de flujo acumulado
    fig.add_trace(go.Scatter(
        x=list(range(1, 13)),
        y=df_summary["flujo_acumulado"].values,
        mode='lines+markers',
        name='Flujo Acumulado',
        line=dict(color='#1f77b4', width=3),
        marker=dict(size=10),
        fill='tozeroy',
        fillcolor='rgba(31, 119, 180, 0.2)'
    ))
    
    # Línea de referencia en 0
    fig.add_hline(y=0, line_dash="dash", line_color="red", annotation_text="Balance 0")
    
    fig.update_layout(
        title=f"Flujo de Caja Acumulado - {year}",
        xaxis_title="Mes",
        yaxis_title="Monto Acumulado (B/.)",
        hovermode='x unified',
        height=500,
        template='plotly_white',
        xaxis=dict(tickmode='linear', tick0=1, dtick=1),
        yaxis=dict(tickformat='$,.0f')
    )
    
    st.plotly_chart(fig, use_container_width=True)


def main() -> None:
    _init_state()
    year, expand_table = sidebar_controls()

    st.title("Planeador de Cashflow 2026")
    st.caption("Define ingresos, gastos e inversiones y visualiza calendario y resumen mensual.")

    flow_form()
    st.divider()
    flows_table()
    st.divider()
    schedule_section(year, expand_table)
    st.divider()
    summary_section(year)


if __name__ == "__main__":
    main()
