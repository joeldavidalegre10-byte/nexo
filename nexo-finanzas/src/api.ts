// Guarda y lee los datos editables. En Hostinger usa api/data.php;
// en local (o si el servidor no responde) usa localStorage como respaldo.
const URL_API = "./api/data.php";
const KEY = "nexo-finanzas";

export async function load<T>(fallback: T): Promise<T> {
  try {
    const r = await fetch(URL_API, { cache: "no-store" });
    if (!r.ok) throw new Error("sin API");
    const d = await r.json();
    if (!d || !Object.keys(d).length) throw new Error("vacío");
    return d as T;
  } catch {
    try {
      const s = localStorage.getItem(KEY);
      return s ? (JSON.parse(s) as T) : fallback;
    } catch {
      return fallback;
    }
  }
}

export async function save<T>(data: T): Promise<void> {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* sin almacenamiento */ }
  try {
    await fetch(URL_API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  } catch { /* sin servidor: queda el respaldo local */ }
}
