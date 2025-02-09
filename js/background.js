function parse_proxy(string) {
    if (!string.length) return;
    
    const re_username_password = /^(?<username>[\w\d]+)\:(?<password>[\w\d]+)$/;
    const re_ip_port = /^(?<ip>\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\:(?<port>\d{1,5})$/;

    // username:password@ip:port 
    if (string.includes("@")) {
        const parts = string.split("@");
        let left = re_username_password.exec(parts[0]);
        if (left) {
            const right = re_ip_port.exec(parts[1]);
            return {...left.groups, ...right.groups};
        } else {
            left = re_ip_port.exec(parts[0]);
            const right = re_username_password.exec(parts[1]);
            return {...right.groups, ...left.groups};
        }
    // username:password:ip:port 
    } else if (string.split(":").length === 4) {
        const parts = string.split(":");
        const left_slice = parts.slice(0, 2).join(":");
        const right_slice = parts.slice(2).join(":");
        let left = re_username_password.exec(left_slice);
        if (left) {
            const right = re_ip_port.exec(right_slice);
            return {...left.groups, ...right.groups};
        } else {
            left = re_ip_port.exec(left_slice);
            const right = re_username_password.exec(right_slice);
            return {...right.groups, ...left.groups};
        }
    }
    return null;
}

async function on_extension_icon_clicker(tab) {
    const proxy = await get_storage_proxy();
    if (!proxy) return;

    const state = await get_storage_state();
    set_storage_state(!state);
}

function on_message_recieved(message, sender) {
    if ("action" in message) {
        switch (message.action) {
        case "enable":
            const proxy = parse_proxy(message.proxy_string);
            set_storage_proxy(proxy);
            set_storage_state(Boolean(proxy));
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

async function is_ignored_host(url) {
    const hostname = url.hostname;
    const hostname_with_port = `${hostname}:${url.port}`;

    const data = await get_storage_ignore_list();
    const ignore_list = new Set(Array.isArray(data) ? data : []);

    return ignore_list.has(hostname) || ignore_list.has(hostname_with_port);
}

async function on_request_recieved(request_detail) {
    const url = new URL(request_detail.url);
    if (await is_ignored_host(url)) return {type: "direct"};
    
    const state = await get_storage_state();
    if (!state) return {type: "direct"};
    
    const proxy = await get_storage_proxy();
    if (proxy?.ip && proxy?.port) {
        return {type: "http", host: proxy.ip, port: proxy.port};
    }
    return {type: "direct"};
}

async function on_auth_required() {
    const proxy = await get_storage_proxy();

    if (proxy?.username && proxy?.password) {
        return {authCredentials: {username: proxy.username, password: proxy.password}};
    }
    return {};
}

function init() {
    browser.browserAction.onClicked.addListener(on_extension_icon_clicker);
    browser.runtime.onMessage.addListener(on_message_recieved);
    browser.proxy.onRequest.addListener(on_request_recieved, {urls: ["<all_urls>"]});
    browser.webRequest.onAuthRequired.addListener(on_auth_required, {urls: ["<all_urls>"]}, ["blocking"]);
}

document.addEventListener("DOMContentLoaded", init);
