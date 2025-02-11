const input_proxy = document.getElementById("input-proxy") as HTMLInputElement;
const input_ignore_host = document.getElementById("input-ignore-host") as HTMLInputElement;
const ignore_host_container = document.getElementById("ignore-host-container");
const ignore_host_item_name = "ignore-host-item";

async function remove_ignore_item(event: Event): Promise<void> {
    const target = (event.target as HTMLElement).parentElement;
    if (!target?.classList.contains("remove")) return;

    const ignore_item = target.closest(`.${ignore_host_item_name}`);
    if (!ignore_item) return;

    const value_item = ignore_item.firstChild?.textContent;
    if (!value_item) return;

    await remove_storage_ignore_list(value_item);
    ignore_item.remove();

    refresh_ignore_items();
}

async function add_ignore_item(text: string): Promise<void> {
    if (!ignore_host_container) return;
    
    const ignore_item = document.createElement("div");
    ignore_item.className = ignore_host_item_name;

    const span = document.createElement("span");
    span.textContent = text.trim();

    const remove_button = document.createElement("button");
    remove_button.className = "remove";
    remove_button.addEventListener("click", remove_ignore_item);

    const remove_icon = document.createElement("span");
    remove_icon.innerHTML = "&times;";

    remove_button.appendChild(remove_icon);
    ignore_item.append(span, remove_button);
    ignore_host_container?.appendChild(ignore_item);
}

function get_ignore_items(): string[] {
    return Array.from(ignore_host_container?.children || [])
        .map((item) => item.textContent?.trim() || "");
}

function get_current_ignore_input(): string {
    return input_ignore_host?.value.trim().toLowerCase() || "";
}

async function update_ignore_items(): Promise<void> {
    if (!ignore_host_container) return;

    const search_value = get_current_ignore_input();
    const ignore_list = await get_storage_ignore_list();

    const filtered_items = ignore_list
        .filter((item) => item.toLowerCase().includes(search_value))
        .sort();

    ignore_host_container.innerHTML = "";
    filtered_items.forEach(add_ignore_item);
}

input_ignore_host?.addEventListener("input", update_ignore_items);

function create_empty_item(): HTMLElement {
    const div = document.createElement("div");
    div.id = "empty-item";
    div.textContent = "host list is empty. example: localhost";
    return div;
}

async function refresh_ignore_items(): Promise<void> {
    if (!ignore_host_container) return;

    const ignore_list = await get_storage_ignore_list();
    if (!ignore_list.length) {
        ignore_host_container.appendChild(create_empty_item());
    } else {
        const sorted_list = ignore_list.sort();
        ignore_host_container.innerHTML = "";
        sorted_list.forEach(add_ignore_item);
    }
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
    send_message({proxy_string: target.value});
}

input_proxy?.addEventListener("change", handle_proxy_input);

function main() {
    refresh_input_proxy();
    refresh_ignore_items();
}

document.addEventListener("DOMContentLoaded", main);
