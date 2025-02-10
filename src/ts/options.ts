const proxy_input = document.getElementById("proxy_input") as HTMLInputElement;
const proxy_ignore_list = document.getElementById("proxy_ignore_list");

async function update_proxy_input(): Promise<void> {
    try {
        const proxy = await get_storage_proxy();
        if (proxy && proxy_input) {
            proxy_input.value = `${proxy.username}:${proxy.password}@${proxy.ip}:${proxy.port}`;
        }
    } catch (error) {
        console.error("[update_proxy_input] Error:", error);
    }
}

async function update_proxy_ignore_list(): Promise<void> {
    try {
        const ignore_list = (await get_storage_ignore_list()) ?? DEFAULT_IGNORE_LIST;
        if (!Array.isArray(ignore_list)) {
            set_storage_ignore_list(DEFAULT_IGNORE_LIST);
            if (proxy_ignore_list) {
                proxy_ignore_list.textContent = DEFAULT_IGNORE_LIST.join(", ");
            }
        } else if (proxy_ignore_list) {
            proxy_ignore_list.textContent = ignore_list.join(", ");
        }
    } catch (error) {
        console.error("[update_proxy_ignore_list] Error:", error);
    }
}

function main() {
    update_proxy_input();
    update_proxy_ignore_list();

    const get_event_value = (event: Event): string => {
        const target = event.target as HTMLInputElement;
        return target.value.trim();
    };

    proxy_input?.addEventListener("change", (event) => {
        send_message({proxy_string: get_event_value(event)});
    });
    proxy_ignore_list?.addEventListener("change", (event) => {
        set_storage_ignore_list(get_event_value(event));
    });
}

document.addEventListener("DOMContentLoaded", main);
