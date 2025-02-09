let proxy_input, proxy_ignore_list;

async function init_proxy_input() {
    try {
        const proxy = await get_storage_proxy();
        if (proxy) {
            proxy_input.value = `${proxy.username}:${proxy.password}@${proxy.ip}:${proxy.port}`;
        }
        console.debug("[proxy_input] Initialized");
    } catch (error) {
        console.error("[proxy_input] Error initialization:", error);
    }
}

async function init_proxy_ignore_list() {
    try {
        const ignore_list = (await get_storage_ignore_list()) ?? DEFAULT_IGNORE_LIST;
        if (!Array.isArray(ignore_list)) {
            set_storage_ignore_list(DEFAULT_IGNORE_LIST);
            proxy_ignore_list.value = DEFAULT_IGNORE_LIST.join(", ");
        } else {
            proxy_ignore_list.value = ignore_list.join(", ");
        }
        console.debug("[proxy_ignore_list] Initialized");
    } catch (error) {
        console.error("[proxy_ignore_list] Error initialization:", error);
    }
}

function init() {
    proxy_input = document.getElementById("proxy_input");
    proxy_ignore_list = document.getElementById("proxy_ignore_list");

    init_proxy_input();
    init_proxy_ignore_list();

    const get_event_value = (event) => event.target.value.trim();

    proxy_input.addEventListener("change", (event) => {
        send_message({proxy_string: get_event_value(event)});
    });
    proxy_ignore_list.addEventListener("change", (event) => {
        set_storage_ignore_list(get_event_value(event));
    });
}

document.addEventListener("DOMContentLoaded", init);
