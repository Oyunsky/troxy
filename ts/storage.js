var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const storage_local = browser.storage.local;
const storage_session = browser.storage.session;
const default_ignore_list = [
    "127.0.0.1",
    "192.168.0.1",
    "localhost",
];
function send_message(message) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield browser.runtime.sendMessage(message);
        }
        catch (error) {
            console.error("Error sending message", message, ":", error);
        }
    });
}
function set_storage_data(storage, data) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield storage.set(data);
            return true;
        }
        catch (error) {
            console.error("Error saving data", data, ":", error);
            return false;
        }
    });
}
function get_storage_data(storage, key) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const data = yield storage.get(key);
            return key in data ? data[key] : null;
        }
        catch (error) {
            console.error(`Error getting data with key ${key}:`, error);
            return null;
        }
    });
}
function get_storage_proxy() {
    return __awaiter(this, void 0, void 0, function* () {
        return (yield get_storage_data(storage_local, "proxy")) || null;
    });
}
function set_storage_proxy(proxy) {
    set_storage_data(storage_local, { proxy });
}
function get_storage_state() {
    return __awaiter(this, void 0, void 0, function* () {
        return (yield get_storage_data(storage_session, "state")) || null;
    });
}
function set_storage_state(state) {
    set_storage_data(storage_local, { state });
}
function get_storage_ignore_list() {
    return __awaiter(this, void 0, void 0, function* () {
        return (yield get_storage_data(storage_local, "ignore_list")) || null;
    });
}
function set_storage_ignore_list(data) {
    if (typeof data === "string") {
        data = data.trim();
        data = data ? data.split(",") : [];
    }
    if (Array.isArray(data)) {
        const ignore_list = data
            .map((item) => item.trim())
            .filter(item => item !== "");
        set_storage_data(storage_local, { ignore_list });
    }
}
