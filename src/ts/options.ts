const input_proxy = document.getElementById("input-proxy") as HTMLInputElement;
const input_ignore_host = document.getElementById("input-ignore-host") as HTMLInputElement;
const div_ignore_items = document.getElementById("ignore-items");

function create_delete_icon(): SVGSVGElement {
    const svgNS = "http://www.w3.org/2000/svg";

    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("width", "14");
    svg.setAttribute("height", "14");
    svg.setAttribute("viewBox", "0 0 14 14");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "1.1");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");

    const line1 = document.createElementNS(svgNS, "line");
    line1.setAttribute("x1", "12");
    line1.setAttribute("y1", "2");
    line1.setAttribute("x2", "2");
    line1.setAttribute("y2", "12");

    const line2 = document.createElementNS(svgNS, "line");
    line2.setAttribute("x1", "2");
    line2.setAttribute("y1", "2");
    line2.setAttribute("x2", "12");
    line2.setAttribute("y2", "12");

    svg.appendChild(line1);
    svg.appendChild(line2);

    return svg;
}

async function remove_ignore_item(event: Event): Promise<void> {
    const target = (event.target as HTMLElement).parentElement;
    if (!target?.classList.contains("delete")) return;

    const ignore_item = target.closest(".ignore-item");
    if (!ignore_item) return;

    const value_item = ignore_item.firstChild?.textContent;
    if (!value_item) return;

    await remove_storage_ignore_list(value_item);
    ignore_item.remove();
}

async function add_ignore_item(text: string): Promise<void> {
    if (!div_ignore_items) return;
    
    const ignore_item = document.createElement("div");
    ignore_item.className = "ignore-item";

    const span = document.createElement("span");
    span.textContent = text.trim();

    const button_delete = document.createElement("button");
    button_delete.className = "delete";
    button_delete.addEventListener("click", remove_ignore_item);

    const svg_delete = create_delete_icon();

    button_delete.appendChild(svg_delete);
    ignore_item.append(span, button_delete);
    div_ignore_items?.appendChild(ignore_item);
}

function get_ignore_items(): string[] {
    return Array.from(div_ignore_items?.children || [])
        .map((item) => item.textContent?.trim() || "");
}

function get_current_ignore_input(): string {
    return input_ignore_host?.value.trim().toLowerCase() || "";
}

async function update_ignore_items(): Promise<void> {
    if (!div_ignore_items) return;

    const search_value = get_current_ignore_input();
    const ignore_list = await get_storage_ignore_list();

    const filtered_items = ignore_list
        .filter((item) => item.toLowerCase().includes(search_value))
        .sort();

    div_ignore_items.innerHTML = "";
    filtered_items.forEach(add_ignore_item);
}

input_ignore_host?.addEventListener("input", update_ignore_items);

async function refresh_ignore_items(): Promise<void> {
    if (!div_ignore_items) return;

    const ignore_list = await get_storage_ignore_list();
    const sorted_list = ignore_list.sort();
    div_ignore_items.innerHTML = "";
    sorted_list.forEach(add_ignore_item);
}

async function handle_enter(event: KeyboardEvent): Promise<void> {
    if (event.key !== "Enter") return;

    const value = get_current_ignore_input();
    if (!value) return;

    await push_storage_ignore_list(value);
    input_ignore_host.value = "";
    refresh_ignore_items();
}

input_ignore_host?.addEventListener("keydown", handle_enter);

async function refresh_input_proxy(): Promise<void> {
    try {
        const proxy = await get_storage_proxy();
        if (!proxy) return;
        input_proxy.value = `${proxy.username}:${proxy.password}@${proxy.ip}:${proxy.port}`;
    } catch (error) {
        console.error("[refresh_input_proxy] Error:", error);
    }
}

function handle_proxy_input(event: Event): void {
    const target = event.target as HTMLInputElement;
    send_message({proxy_string: target.value.trim()});
}

input_ignore_host?.addEventListener("change", handle_proxy_input);

function main() {
    refresh_input_proxy();
    refresh_ignore_items();
}

document.addEventListener("DOMContentLoaded", main);
