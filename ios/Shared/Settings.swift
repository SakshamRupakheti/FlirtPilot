import Foundation
import Security

enum Settings {
    static let defaults = UserDefaults(suiteName: "group.com.flirtpilot.shared")!
    static var endpoint: String {
        get { defaults.string(forKey: "endpoint") ?? "" }
        set { defaults.set(newValue, forKey: "endpoint") }
    }
    static var validURL: URL? {
        guard let url = URL(string: endpoint), url.scheme == "https", url.host != nil,
              url.user == nil, url.password == nil, url.query == nil, url.fragment == nil,
              url.path == "/api/keyboard" else { return nil }
        return url
    }
    private static var query: [String: Any] {
        var result: [String: Any] = [kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: "FlirtPilotKeyboard", kSecAttrAccount as String: "device-token"]
        if let group = Bundle.main.object(forInfoDictionaryKey: "SharedKeychainGroup") as? String {
            result[kSecAttrAccessGroup as String] = group
        }
        return result
    }
    static func token() -> String? {
        var request = query
        request[kSecReturnData as String] = true
        request[kSecMatchLimit as String] = kSecMatchLimitOne
        var item: CFTypeRef?
        guard SecItemCopyMatching(request as CFDictionary, &item) == errSecSuccess,
              let data = item as? Data else { return nil }
        return String(data: data, encoding: .utf8)
    }
    static func saveToken(_ token: String) -> Bool {
        let data = Data(token.utf8)
        let status = SecItemUpdate(query as CFDictionary, [kSecValueData as String: data] as CFDictionary)
        if status == errSecSuccess { return true }
        guard status == errSecItemNotFound else { return false }
        var item = query
        item[kSecValueData as String] = data
        item[kSecAttrAccessible as String] = kSecAttrAccessibleWhenUnlockedThisDeviceOnly
        return SecItemAdd(item as CFDictionary, nil) == errSecSuccess
    }
    static func clear() {
        SecItemDelete(query as CFDictionary)
        defaults.removeObject(forKey: "endpoint")
    }
}
