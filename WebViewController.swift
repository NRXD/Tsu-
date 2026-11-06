import UIKit
import WebKit
import AVFoundation

final class WebViewController: UIViewController, WKUIDelegate, WKNavigationDelegate {

    private var webView: WKWebView!
    private let startURL = URL(string: "https://discord.com/app")!

    // Desktop Safari identity so Discord loads the full desktop client (the one ツcore is built for).
    private let desktopUA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15"

    override var preferredStatusBarStyle: UIStatusBarStyle { .lightContent }
    override var prefersHomeIndicatorAutoHidden: Bool { true }

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .black
        configureAudio()

        let config = WKWebViewConfiguration()
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []
        config.allowsAirPlayForMediaPlayback = true
        config.preferences.javaScriptCanOpenWindowsAutomatically = true
        config.defaultWebpagePreferences.preferredContentMode = .desktop

        // ツcore, injected in the page before Discord's own code runs (same as the browser extension).
        for name in ["picture", "fakedeafen", "injector"] {
            if let src = loadScript(name) {
                let us = WKUserScript(source: src, injectionTime: .atDocumentStart, forMainFrameOnly: true, in: .page)
                config.userContentController.addUserScript(us)
            }
        }

        let wv = WKWebView(frame: .zero, configuration: config)
        wv.customUserAgent = desktopUA
        wv.uiDelegate = self
        wv.navigationDelegate = self
        wv.allowsBackForwardNavigationGestures = true
        wv.isOpaque = false
        wv.backgroundColor = .black
        wv.scrollView.backgroundColor = .black
        wv.scrollView.contentInsetAdjustmentBehavior = .never
        wv.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(wv)
        let g = view.safeAreaLayoutGuide
        NSLayoutConstraint.activate([
            wv.topAnchor.constraint(equalTo: g.topAnchor),
            wv.bottomAnchor.constraint(equalTo: g.bottomAnchor),
            wv.leadingAnchor.constraint(equalTo: g.leadingAnchor),
            wv.trailingAnchor.constraint(equalTo: g.trailingAnchor)
        ])
        webView = wv
        wv.load(URLRequest(url: startURL))

        let nc = NotificationCenter.default
        nc.addObserver(self, selector: #selector(audioChanged), name: UIApplication.didBecomeActiveNotification, object: nil)
        nc.addObserver(self, selector: #selector(audioChanged), name: AVAudioSession.interruptionNotification, object: nil)
        nc.addObserver(self, selector: #selector(audioChanged), name: AVAudioSession.routeChangeNotification, object: nil)
    }

    private func loadScript(_ name: String) -> String? {
        guard let url = Bundle.main.url(forResource: name, withExtension: "js") else { return nil }
        return try? String(contentsOf: url, encoding: .utf8)
    }

    // Call-friendly audio session: speaker by default, Bluetooth allowed, normal (non voice-processing) mode.
    private func configureAudio() {
        let s = AVAudioSession.sharedInstance()
        do {
            try s.setCategory(.playAndRecord, mode: .default,
                              options: [.defaultToSpeaker, .allowBluetooth, .allowBluetoothA2DP])
            try s.setActive(true)
        } catch {
            NSLog("TsuCore audio session error: \(error)")
        }
    }

    @objc private func audioChanged() { configureAudio() }

    // MARK: microphone / camera permission for the page
    @available(iOS 15.0, *)
    func webView(_ webView: WKWebView,
                 requestMediaCapturePermissionFor origin: WKSecurityOrigin,
                 initiatedByFrame frame: WKFrameInfo,
                 type: WKMediaCaptureType,
                 decisionHandler: @escaping (WKPermissionDecision) -> Void) {
        configureAudio()
        decisionHandler(.grant)
    }

    // MARK: links that want a new window
    func webView(_ webView: WKWebView,
                 createWebViewWith configuration: WKWebViewConfiguration,
                 for navigationAction: WKNavigationAction,
                 windowFeatures: WKWindowFeatures) -> WKWebView? {
        if navigationAction.targetFrame == nil, let url = navigationAction.request.url {
            if let host = url.host, host.contains("discord") {
                webView.load(URLRequest(url: url))
            } else {
                UIApplication.shared.open(url)
            }
        }
        return nil
    }

    // MARK: JS dialogs
    func webView(_ webView: WKWebView, runJavaScriptAlertPanelWithMessage message: String,
                 initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping () -> Void) {
        let a = UIAlertController(title: nil, message: message, preferredStyle: .alert)
        a.addAction(UIAlertAction(title: "OK", style: .default) { _ in completionHandler() })
        present(a, animated: true)
    }

    func webView(_ webView: WKWebView, runJavaScriptConfirmPanelWithMessage message: String,
                 initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (Bool) -> Void) {
        let a = UIAlertController(title: nil, message: message, preferredStyle: .alert)
        a.addAction(UIAlertAction(title: "Cancel", style: .cancel) { _ in completionHandler(false) })
        a.addAction(UIAlertAction(title: "OK", style: .default) { _ in completionHandler(true) })
        present(a, animated: true)
    }

    // MARK: recover if iOS kills the web process
    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
        webView.reload()
    }
}
