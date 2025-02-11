const input_proxy: HTMLInputElement | null = document.getElementById("input-proxy") as HTMLInputElement | null;
const input_ignore_host: HTMLInputElement | null = document.getElementById("input-ignore-host") as HTMLInputElement | null;
const ignore_host_container: HTMLElement | null = document.getElementById("ignore-host-container");

const IGNORE_HOST_ITEM_CLASS = "ignore-host-item";
const EMPTY_MESSAGE_ELEMENT_ID = "empty-ignore-host-message";

const get_ignore_host_input_value = (): string => input_ignore_host?.value.trim().toLowerCase() || "";

const append_host = async (text: string): Promise<void> => {
    if (!ignore_host_container) return;

    const ignore_item = document.createElement("div");
    ignore_item.className = IGNORE_HOST_ITEM_CLASS;

    const span = document.createElement("span");
    span.textContent = text.trim();

    const remove_button = document.createElement("button");
    remove_button.className = "remove";
    remove_button.addEventListener("click", remove_host);

    const remove_icon = document.createElement("span");
    remove_icon.innerHTML = "&times;";

    remove_button.appendChild(remove_icon);
    ignore_item.append(span, remove_button);
    ignore_host_container.appendChild(ignore_item);
};

const remove_host = async (event: Event): Promise<void> => {
    const target = (event.target as HTMLElement).closest(".remove");
    if (!target) return;

    const ignore_item = target.closest(`.${IGNORE_HOST_ITEM_CLASS}`);
    if (!ignore_item) return;

    const value_item = ignore_item.firstChild?.textContent;
    if (!value_item) return;

    await storage_remove_ignore_host(value_item);
    ignore_item.remove();

    if (input_ignore_host) input_ignore_host.value = "";
    refresh_ignore_hosts();
};

const refresh_ignore_hosts = async (): Promise<void> => {
    if (!ignore_host_container) return;

    const search_query = get_ignore_host_input_value();
    const ignore_hosts = await storage_get_ignore_hosts() || [];

    let empty_msg_el: HTMLElement | null = document.getElementById(EMPTY_MESSAGE_ELEMENT_ID);
    if (!empty_msg_el) {
        empty_msg_el = document.createElement("div");
        empty_msg_el.id = EMPTY_MESSAGE_ELEMENT_ID;
        empty_msg_el.textContent = "host ignore list is empty";
    }

    ignore_host_container.innerHTML = "";
    if (ignore_hosts.length === 0) {
        ignore_host_container.appendChild(empty_msg_el);
        return;
    }

    ignore_hosts
        .filter((host) => host.toLowerCase().includes(search_query))
        .sort()
        .forEach(append_host);
};

const refresh_input_proxy = async (): Promise<void> => {
    try {
        const proxy = await storage_get_proxy();
        if (!proxy || !input_proxy) return;
        input_proxy.value = `${proxy.username}:${proxy.password}@${proxy.ip}:${proxy.port}`;
    } catch (error) {
        console.error("[refresh_input_proxy] error:", error);
    }
};

const handle_input_proxy = async (event: Event): Promise<void> => {
    const target = event.target as HTMLInputElement;
    const msg = {proxy_string: target.value};
    try {
        await browser.runtime.sendMessage(msg);
    } catch (error) {
        console.error("[handle_input_proxy] error:", error, msg);
    }
};

const handle_input_ignore_hosts = async (event: KeyboardEvent): Promise<void> => {
    if (event.key !== "Enter") return;

    const value = get_ignore_host_input_value();
    if (!value) return;

    await storage_push_ignore_host(value);
    if (input_ignore_host) input_ignore_host.value = "";
    refresh_ignore_hosts();
};

input_proxy?.addEventListener("change", handle_input_proxy);
input_ignore_host?.addEventListener("keydown", handle_input_ignore_hosts);
input_ignore_host?.addEventListener("input", refresh_ignore_hosts);

const main = (): void => {
    refresh_input_proxy();
    refresh_ignore_hosts();
};

document.addEventListener("DOMContentLoaded", main);
