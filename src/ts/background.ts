const DIRECT_CONNECTION = {type: "direct"};

function parse_proxy(input: string): ProxyT | null {
    const t_input = input.trim()
    if (!t_input.length) return null;

    const re_user_pass = /^(?<username>[\w\d]+)\:(?<password>[\w\d]+)$/;
    const re_ip_port = /^(?<ip>\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\:(?<port>\d{1,5})$/;

    const parse_parts = (left: string, right: string): ProxyT | null => {
        const m1 = re_user_pass.exec(left);
        const m2 = re_ip_port.exec(right);
        if (m1?.groups && m2?.groups) return {...m1?.groups, ...m2?.groups};

        const m1_r = re_ip_port.exec(left);
        const m2_r = re_user_pass.exec(right);
        if (m1_r?.groups && m2_r?.groups) return {...m1_r?.groups, ...m2_r?.groups};

        return null;
    };
   
    if (t_input.includes("@")) {
        const [left, right] = t_input.split("@");
        return parse_parts(left, right);
    } else if (t_input.split(":").length === 4) {
        const parts = t_input.split(":");
        const left = parts.slice(0, 2).join(":");
        const right = parts.slice(2).join(":");
        return parse_parts(left, right);
    }
    return null;
}

async function is_ignored_host(url: URL): Promise<boolean> {
    const hostname = url.hostname;
    const hostname_port = `${hostname}:${url.port}`;
    try {
        const data = await storage_get_ignore_hosts();
        const ignore_list = new Set<string>(Array.isArray(data) ? data : []);
        return ignore_list.has(hostname) || ignore_list.has(hostname_port);
    } catch (error) {
        console.error("[is_ignore_host] error:", error);
        return false;
    }
}

async function on_request_recieved(request: RequestDetailsT) {
    try {
        const url = new URL(request.url);
        if (await is_ignored_host(url)) return DIRECT_CONNECTION;

        const state = await storage_get_state();
        if (!state) return DIRECT_CONNECTION;

        const {ip, port} = await storage_get_proxy() || {};
        return ip && port ? {type: "http", host: ip, port} : DIRECT_CONNECTION;
    } catch (error) {
        console.error("[on_request_recieved] error:", error);
    }
}

browser.proxy.onRequest.addListener(on_request_recieved, {urls: ["<all_urls>"]});

async function on_auth_required(): Promise<BlockingResponseT | object> {
    try {
        const {username, password} = await storage_get_proxy() || {};
        if (username && password) return {authCredentials: {username, password}};
    } catch (error) {
        console.error("[on_auth_required] error:", error);
    }
    return {};
}

browser.webRequest.onAuthRequired.addListener(on_auth_required, {urls: ["<all_urls>"]}, ["blocking"]);

async function on_message_recieved(message: EventMessageT, _sender: SenderT): Promise<void> {
    try {
        if ("proxy_string" in message) {
            const proxy = parse_proxy(message.proxy_string);
            if (proxy) await storage_set_proxy(proxy);
        }
    } catch (error) {
        console.error("[on_message_recieved] error:", error);
    }
}

browser.runtime.onMessage.addListener(on_message_recieved);

async function on_addon_clicked(_tab: TabT): Promise<void> {
    try {
        const proxy = await storage_get_proxy();
        if (!proxy) return;

        const state = await storage_get_state();
        await storage_set_state(!state);
    } catch (error) {
        console.error("[on_addon_clicked] error:", error);
    }
}

browser.browserAction.onClicked.addListener(on_addon_clicked);
