function parse_proxy(string: string): ProxyT | null {
    if (!string.length) return null;

    const re_user_pass = /^(?<username>[\w\d]+)\:(?<password>[\w\d]+)$/;
    const re_ip_port = /^(?<ip>\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\:(?<port>\d{1,5})$/;
   
    if (string.includes("@")) {
        const parts = string.split("@");
        let left = re_user_pass.exec(parts[0]);
        if (left?.groups) {
            const right = re_ip_port.exec(parts[1]);
            return {...left?.groups, ...right?.groups};
        } else {
            left = re_ip_port.exec(parts[0]);
            const right = re_user_pass.exec(parts[1]);
            return {...left?.groups, ...right?.groups};
        }
    } else if (string.split(":").length === 4) {
        const parts = string.split(":");
        const left_slice = parts.slice(0, 2).join(":");
        const right_slice = parts.slice(2).join(":");
        let left = re_user_pass.exec(left_slice);
        if (left?.groups) {
            const right = re_ip_port.exec(right_slice);
            return {...left?.groups, ...right?.groups};
        } else {
            left = re_ip_port.exec(left_slice);
            const right = re_user_pass.exec(right_slice);
            return {...left?.groups, ...right?.groups};
        }
    }
    return null;
}

async function on_extension_icon_clicked(_tab: TabT): Promise<void> {
    const proxy = await get_storage_proxy();
    console.debug("[on_extension_icon_clicked] Proxy:", proxy);
    if (!proxy) return;

    const state = await get_storage_state();
    console.debug("[on_extension_icon_clicked] State:", state);
    set_storage_state(!state);
}

browser.browserAction.onClicked.addListener(on_extension_icon_clicked);

function on_message_recieved(message: EventMessageT, _sender: SenderT): void {
    if ("action" in message) {
        switch (message.action) {
        case "enable":
            set_storage_state(true);
            break;
        case "disable":
            set_storage_state(false);
            break;
        }
    }
    if ("proxy_string" in message) {
        const proxy = parse_proxy(message.proxy_string);
        set_storage_proxy(proxy);
    }
}

browser.runtime.onMessage.addListener(on_message_recieved);

async function is_ignored_host(url: URL): Promise<boolean> {
    const hname = url.hostname;
    const hname_port = `${hname}:${url.port}`;

    const data = await get_storage_ignore_list();
    const ignore_list = new Set<string>(Array.isArray(data) ? data : []);

    return ignore_list.has(hname) || ignore_list.has(hname_port);
}

async function on_request_recieved(request: RequestDetailsT) {
    const url = new URL(request.url);
    if (await is_ignored_host(url)) return {type: "direct"};

    const state = await get_storage_state();
    if (!state) return {type: "direct"};

    const proxy = await get_storage_proxy();
    if (proxy?.ip && proxy?.port) {
        return {type: "http", host: proxy.ip, port: proxy.port};
    }
    return {type: "direct"};
}

browser.proxy.onRequest.addListener(on_request_recieved, {urls: ["<all_urls>"]});

async function on_auth_required(): Promise<browser.webRequest.BlockingResponse | object> {
    const proxy = await get_storage_proxy();
    if (proxy?.username && proxy?.password) {
        return {authCredentials: {username: proxy.username, password: proxy.password}};
    }
    return {};
}

browser.webRequest.onAuthRequired.addListener(on_auth_required, {urls: ["<all_urls>"]}, ["blocking"]);
