const input_proxy = document.getElementById("input-proxy") as HTMLInputElement;
const input_ignore_list = document.getElementById("input-ignore-list") as HTMLInputElement;
const ignore_items = document.getElementById("ignore-items");

async function remove_ignore_item(event: Event): Promise<void> {
    const target = event.target as HTMLElement;
    if (!target.classList.contains("delete_btn")) return;

    const ignore_item = target.closest(".ignore-item");
    if (!ignore_item) return;

    const value_item = ignore_item.querySelector(".value")?.textContent;
    if (!value_item) return;

    await remove_storage_ignore_list(value_item);
    ignore_item.remove();
}

async function add_ignore_item(text: string): Promise<void> {
    if (!ignore_items) return;
    
    const item = document.createElement("div");
    item.className = "ignore-item";

    const inner_item = document.createElement("span");
    inner_item.className = "value";
    inner_item.textContent = text;

    const delete_btn = document.createElement("button");
    delete_btn.className = "delete_btn";
    delete_btn.textContent = "x";
    delete_btn.addEventListener("click", remove_ignore_item);

    item.append(inner_item, delete_btn);
    ignore_items?.appendChild(item);
}

function get_ignore_items(): string[] {
    return Array.from(ignore_items?.children || [])
        .map((item) => item.textContent?.trim() || "");
}

function get_current_ignore_input(): string {
    return input_ignore_list?.value.trim().toLowerCase();
}

async function update_ignore_items(): Promise<void> {
    if (!ignore_items) return;

    const search_value = input_ignore_list?.value.trim().toLowerCase() || "";
    const ignore_list = await get_storage_ignore_list();

    const filtered_items = ignore_list
        .filter((item) => item.toLowerCase().includes(search_value))
        .sort();

    ignore_items.innerHTML = "";
    filtered_items.forEach(add_ignore_item);
}

input_ignore_list?.addEventListener("input", update_ignore_items);

async function refresh_ignore_items(): Promise<void> {
    if (!ignore_items) return;
    const ignore_list = await get_storage_ignore_list();
    ignore_items.innerHTML = "";
    ignore_list.forEach(add_ignore_item);
}

async function handle_enter(event: KeyboardEvent): Promise<void> {
    if (event.key !== "Enter") return;

    const value = input_ignore_list?.value.trim().toLowerCase();
    if (!value) return;

    await push_storage_ignore_list(value);
    input_ignore_list.value = "";
    refresh_ignore_items();
}

input_ignore_list?.addEventListener("keydown", handle_enter);

async function update_proxy_input(): Promise<void> {
    try {
        const proxy = await get_storage_proxy();
        if (!proxy) return;
        input_proxy.value = `${proxy.username}:${proxy.password}@${proxy.ip}:${proxy.port}`;
    } catch (error) {
        console.error("[update_proxy_input] Error:", error);
    }
}

function handle_proxy_input(event: Event): void {
    const target = event.target as HTMLInputElement;
    send_message({proxy_string: target.value.trim()});
}

input_ignore_list?.addEventListener("change", handle_proxy_input);

function main() {
    update_proxy_input();
    refresh_ignore_items();
}

document.addEventListener("DOMContentLoaded", main);
