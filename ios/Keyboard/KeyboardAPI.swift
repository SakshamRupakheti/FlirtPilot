import Foundation

struct KeyboardResponse: Decodable {
    let status: String?
    let suggestions: [String]?
    let message: String?
    let error: String?
}

final class KeyboardAPI: NSObject, URLSessionTaskDelegate {
    // Never forward device credentials to a redirect target.
    func urlSession(_ session: URLSession, task: URLSessionTask,
                    willPerformHTTPRedirection response: HTTPURLResponse,
                    newRequest request: URLRequest,
                    completionHandler: @escaping (URLRequest?) -> Void) { completionHandler(nil) }

    func suggest(text: String, mode: String, vibe: String) async throws -> KeyboardResponse {
        guard let url = Settings.validURL, let token = Settings.token() else { throw URLError(.userAuthenticationRequired) }
        let config = URLSessionConfiguration.ephemeral
        config.urlCache = nil
        config.httpCookieStorage = nil
        config.timeoutIntervalForRequest = 50
        let session = URLSession(configuration: config, delegate: self, delegateQueue: nil)
        defer { session.invalidateAndCancel() }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.httpBody = try JSONSerialization.data(withJSONObject: [
            "draft": mode == "rewrite" ? text : "", "theirMessage": mode == "reply" ? text : "",
            "mode": mode, "vibe": vibe, "adultConfirmed": true,
        ])
        let (data, response) = try await session.data(for: request)
        guard let http = response as? HTTPURLResponse, data.count <= 16000 else { throw URLError(.badServerResponse) }
        let result = try JSONDecoder().decode(KeyboardResponse.self, from: data)
        guard http.statusCode == 200 else { return KeyboardResponse(status: nil, suggestions: nil, message: nil, error: result.error ?? "Could not get suggestions.") }
        if result.status == "suggestions" {
            guard let suggestions = result.suggestions, suggestions.count == 3,
                  suggestions.allSatisfy({ !$0.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty && $0.count <= 240 }) else { throw URLError(.cannotParseResponse) }
        } else if result.status != "boundary" { throw URLError(.cannotParseResponse) }
        return result
    }
}
