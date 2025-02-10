function parse_proxy(input: string): ProxyT | null {
    if (!input.length) return null;

    const re_user_pass = /^(?<username>[\w\d]+)\:(?<password>[\w\d]+)$/;
    const re_ip_port = /^(?<ip>\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\:(?<port>\d{1,5})$/;

    const parse_parts = (left: string, right: string): ProxyT | null => {
        const m1 = re_user_pass.exec(left);
        const m2 = re_ip_port.exec(right);
        if (m1?.groups && m2?.groups) return {...m1?.groups, ...m2?.groups};

        const m1_r = re_ip_port.exec(left);
        const m2_r = re_user_pass.exec(right);
        if (m1_r?.groups && m2_r?.groups) return {...m1_r?.groups, ...m2_r?.groups};
    };
   
    if (input.includes("@")) {
        const [left, right] = input.split("@");
        return parse_parts(left, right);
    } else if (input.split(":").length === 4) {
        const parts = input.split(":");
        const left = parts.slice(0, 2).join(":");
        const right = parts.slice(2).join(":");
        return parse_parts(left, right);
    }
    return null;
}

async function on_extension_icon_clicked(_tab: TabT): Promise<void> {
    const proxy = await get_storage_proxy();
    if (!proxy) return;

    const state = await get_storage_state();
    await set_storage_state(!state);
}

browser.browserAction.onClicked.addListener(on_extension_icon_clicked);

async function on_message_recieved(message: EventMessageT, _sender: SenderT): Promise<void> {
    if ("proxy_string" in message) {
        const proxy = parse_proxy(message.proxy_string);
        await set_storage_proxy(proxy);
    }
}

browser.runtime.onMessage.addListener(on_message_recieved);

async function is_ignored_host(url: URL): Promise<boolean> {
    const hostname = url.hostname;
    const hostname_port = `${hostname}:${url.port}`;
    try {
        const data = await get_storage_ignore_list();
        const ignore_list = new Set<string>(Array.isArray(data) ? data : []);

        return ignore_list.has(hostname) || ignore_list.has(hostname_port);
    } catch (error) {
        console.error("[is_ignore_host] Error:", error);
        return false;
    }
}

async function on_request_recieved(request: RequestDetailsT) {
    const url = new URL(request.url);
    if (await is_ignored_host(url)) return {type: "direct"};

    const state = await get_storage_state();
    if (!state) return {type: "direct"};

    const {ip, port} = await get_storage_proxy() || {};
    return ip && port ? {type: "http", host: ip, port} : {type: "direct"};
}

browser.proxy.onRequest.addListener(on_request_recieved, {urls: ["<all_urls>"]});

async function on_auth_required(): Promise<BlockingResponseT | object> {
    try {
        const {username, password} = await get_storage_proxy() || {};
        if (username && password) return {authCredentials: {username, password}};
    } catch (error) {
        console.error("[on_auth_required] Error:", error);
    }
    return {};
}

browser.webRequest.onAuthRequired.addListener(on_auth_required, {urls: ["<all_urls>"]}, ["blocking"]);
