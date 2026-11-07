import UIKit
import WebKit
import AVFoundation

final class WebViewController: UIViewController, WKUIDelegate, WKNavigationDelegate, WKScriptMessageHandler {

    private var webView: WKWebView!
    private let startURL = URL(string: "https://discord.com/app")!
    private let statusLabel = UILabel()
    private let gearButton = UIButton(type: .system)
    private var lastError = "none"
    private var finished = false

    // Desktop Safari identity so Discord loads the full desktop client (the one ツcore is built for).
    private let desktopUA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15"

    // ツcore ON/OFF (saved). Use the gear button to switch if the screen is blank.
    private var injectEnabled: Bool {
        get { return UserDefaults.standard.object(forKey: "tsu_inject") as? Bool ?? true }
        set { UserDefaults.standard.set(newValue, forKey: "tsu_inject") }
    }

    // View width in CSS pixels: smaller number = BIGGER screen/text. Saved.
    private var viewWidth: Int {
        get { let v = UserDefaults.standard.integer(forKey: "tsu_width"); return v == 0 ? 700 : v }
        set { UserDefaults.standard.set(newValue, forKey: "tsu_width") }
    }
    // Smooth mode (default ON): ツcore Lite audio + no animations / blur in Discord = much less lag.
    private var smoothMode: Bool {
        get { return UserDefaults.standard.object(forKey: "tsu_smooth") as? Bool ?? true }
        set { UserDefaults.standard.set(newValue, forKey: "tsu_smooth") }
    }

    override var preferredStatusBarStyle: UIStatusBarStyle { return .lightContent }
    override var prefersHomeIndicatorAutoHidden: Bool { return true }

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .black
        configureAudio()

        let config = WKWebViewConfiguration()
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []
        config.allowsAirPlayForMediaPlayback = true
        config.preferences.javaScriptCanOpenWindowsAutomatically = true
        config.defaultWebpagePreferences.preferredContentMode = .mobile   // our own viewport width below, desktop Discord via the user agent
        config.userContentController.add(self, name: "n7r")

        let wv = WKWebView(frame: .zero, configuration: config)
        wv.customUserAgent = desktopUA
        wv.uiDelegate = self
        wv.navigationDelegate = self
        wv.allowsBackForwardNavigationGestures = false
        wv.isOpaque = true
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

        // Status text (so the screen is never silently black)
        statusLabel.translatesAutoresizingMaskIntoConstraints = false
        statusLabel.textColor = .white
        statusLabel.font = UIFont.systemFont(ofSize: 15, weight: .semibold)
        statusLabel.numberOfLines = 0
        statusLabel.textAlignment = .center
        statusLabel.isUserInteractionEnabled = false
        view.addSubview(statusLabel)
        NSLayoutConstraint.activate([
            statusLabel.centerYAnchor.constraint(equalTo: view.centerYAnchor),
            statusLabel.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 24),
            statusLabel.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -24)
        ])

        // Gear button (bottom-left): reload / ツcore on-off / clear data
        gearButton.translatesAutoresizingMaskIntoConstraints = false
        gearButton.setTitle("⚙︎", for: .normal)
        gearButton.setTitleColor(.white, for: .normal)
        gearButton.titleLabel?.font = UIFont.systemFont(ofSize: 22)
        gearButton.backgroundColor = UIColor(white: 0, alpha: 0.55)
        gearButton.layer.cornerRadius = 22
        gearButton.alpha = 0.7
        gearButton.addTarget(self, action: #selector(gearTapped), for: .touchUpInside)
        view.addSubview(gearButton)
        NSLayoutConstraint.activate([
            gearButton.widthAnchor.constraint(equalToConstant: 44),
            gearButton.heightAnchor.constraint(equalToConstant: 44),
            gearButton.leadingAnchor.constraint(equalTo: g.leadingAnchor, constant: 10),
            gearButton.bottomAnchor.constraint(equalTo: g.bottomAnchor, constant: -10)
        ])

        installScripts()
        loadDiscord()

        let nc = NotificationCenter.default
        nc.addObserver(self, selector: #selector(audioChanged), name: UIApplication.didBecomeActiveNotification, object: nil)
        nc.addObserver(self, selector: #selector(audioChanged), name: AVAudioSession.interruptionNotification, object: nil)
        nc.addObserver(self, selector: #selector(audioChanged), name: AVAudioSession.routeChangeNotification, object: nil)
    }

    // MARK: scripts
    private func loadScript(_ name: String) -> String? {
        guard let url = Bundle.main.url(forResource: name, withExtension: "js") else { return nil }
        return try? String(contentsOf: url, encoding: .utf8)
    }

    private func installScripts() {
        let ucc = webView.configuration.userContentController
        ucc.removeAllUserScripts()
        // error spy: reports JS errors back to the app so we can see what went wrong
        let spy = "(function(){function s(m){try{window.webkit.messageHandlers.n7r.postMessage(String(m).slice(0,300));}catch(e){}}" +
                  "window.addEventListener('error',function(e){s('JS error: '+e.message+' @'+String(e.filename||'').split('/').pop()+':'+e.lineno);});" +
                  "window.addEventListener('unhandledrejection',function(e){s('Promise: '+(e.reason&&e.reason.message||e.reason));});})();"
        ucc.addUserScript(WKUserScript(source: spy, injectionTime: .atDocumentStart, forMainFrameOnly: true, in: .page))
        // screen size (viewport) control
        let vp = "(function(){window.__tsuW=\(viewWidth);function set(){try{var h=document.head||document.documentElement;if(!h)return;var m=document.querySelector('meta[name=viewport]');if(!m){m=document.createElement('meta');m.setAttribute('name','viewport');h.appendChild(m);}var c='width='+window.__tsuW+',minimum-scale=0.2,maximum-scale=5,user-scalable=yes';if(m.getAttribute('content')!==c)m.setAttribute('content',c);}catch(e){}}window.__tsuVP=function(x){window.__tsuW=x;set();};set();var n=0;var t=setInterval(function(){set();if(++n>25)clearInterval(t);},400);document.addEventListener('DOMContentLoaded',set);window.addEventListener('load',set);})();"
        ucc.addUserScript(WKUserScript(source: vp, injectionTime: .atDocumentStart, forMainFrameOnly: true, in: .page))
        // smooth mode
        let css = "*,*::before,*::after{animation-duration:0.01ms!important;animation-delay:0s!important;transition-duration:0.01ms!important;transition-delay:0s!important;scroll-behavior:auto!important}*{-webkit-backdrop-filter:none!important;backdrop-filter:none!important}"
        let sm: String
        if smoothMode {
            sm = "(function(){try{localStorage.setItem('n7r_lite','1');}catch(e){}function a(){if(document.getElementById('tsu-smooth'))return;var s=document.createElement('style');s.id='tsu-smooth';s.textContent='" + css + "';(document.head||document.documentElement).appendChild(s);}a();document.addEventListener('DOMContentLoaded',a);})();"
        } else {
            sm = "try{localStorage.removeItem('n7r_lite');}catch(e){}"
        }
        ucc.addUserScript(WKUserScript(source: sm, injectionTime: .atDocumentStart, forMainFrameOnly: true, in: .page))
        guard injectEnabled else { return }
        for name in ["picture", "fakedeafen", "injector"] {
            if let src = loadScript(name) {
                ucc.addUserScript(WKUserScript(source: src, injectionTime: .atDocumentStart, forMainFrameOnly: true, in: .page))
            }
        }
    }

    private func loadDiscord() {
        finished = false
        showStatus("ツcore\nLoading Discord…" + (injectEnabled ? "" : "\n(ツcore is OFF)"), autoHide: nil)
        webView.load(URLRequest(url: startURL))
        DispatchQueue.main.asyncAfter(deadline: .now() + 15) { [weak self] in
            guard let self = self, !self.finished else { return }
            self.showStatus("Still loading…\nTap ⚙︎ (bottom left) → Run WITHOUT ツcore, or Reload", autoHide: nil)
        }
    }

    private func showStatus(_ text: String, autoHide: TimeInterval?) {
        DispatchQueue.main.async {
            self.statusLabel.text = text
            self.statusLabel.alpha = 1
            if let t = autoHide {
                DispatchQueue.main.asyncAfter(deadline: .now() + t) {
                    UIView.animate(withDuration: 0.4) { self.statusLabel.alpha = 0 }
                }
            }
        }
    }

    // MARK: gear menu
    @objc private func gearTapped() {
        let on = injectEnabled
        let a = UIAlertController(title: "ツcore", message: "Screen size: \(viewWidth)  •  Smooth: \(smoothMode ? "ON" : "OFF")  •  ツcore: \(on ? "ON" : "OFF")\nLast page message: \(lastError)", preferredStyle: .actionSheet)
        a.addAction(UIAlertAction(title: "Screen size / zoom…", style: .default) { _ in self.zoomMenu() })
        a.addAction(UIAlertAction(title: smoothMode ? "Smooth mode: turn OFF" : "Smooth mode: turn ON", style: .default) { _ in
            self.smoothMode = !self.smoothMode
            self.installScripts()
            self.loadDiscord()
        })
        a.addAction(UIAlertAction(title: "Reload", style: .default) { _ in self.loadDiscord() })
        a.addAction(UIAlertAction(title: on ? "Run WITHOUT ツcore" : "Run WITH ツcore", style: .default) { _ in
            self.injectEnabled = !on
            self.installScripts()
            self.loadDiscord()
        })
        a.addAction(UIAlertAction(title: "Clear Discord data (log out)", style: .destructive) { _ in
            WKWebsiteDataStore.default().removeData(ofTypes: WKWebsiteDataStore.allWebsiteDataTypes(),
                                                   modifiedSince: Date(timeIntervalSince1970: 0)) {
                self.loadDiscord()
            }
        })
        a.addAction(UIAlertAction(title: "Cancel", style: .cancel))
        a.popoverPresentationController?.sourceView = gearButton
        a.popoverPresentationController?.sourceRect = gearButton.bounds
        present(a, animated: true)
    }

    private func zoomMenu() {
        let a = UIAlertController(title: "Screen size", message: "Bigger = Discord looks larger. You can also pinch to zoom.", preferredStyle: .actionSheet)
        let opts: [(String, Int)] = [("Smallest (980)", 980), ("Small (820)", 820), ("Normal (700)", 700),
                                     ("Big (600)", 600), ("Bigger (520)", 520), ("Huge (440)", 440)]
        for (name, w) in opts {
            a.addAction(UIAlertAction(title: (w == viewWidth ? "✓ " : "") + name, style: .default) { _ in
                self.viewWidth = w
                self.installScripts()
                self.webView.evaluateJavaScript("window.__tsuVP && window.__tsuVP(\(w))", completionHandler: nil)
            })
        }
        a.addAction(UIAlertAction(title: "Cancel", style: .cancel))
        a.popoverPresentationController?.sourceView = gearButton
        a.popoverPresentationController?.sourceRect = gearButton.bounds
        present(a, animated: true)
    }

    // MARK: script messages from the page
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        lastError = "\(message.body)"
        showStatus(lastError, autoHide: 8)
    }

    // MARK: audio
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

    // MARK: navigation
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        finished = true
        if lastError == "none" {
            UIView.animate(withDuration: 0.4) { self.statusLabel.alpha = 0 }
        }
    }

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        showStatus("Couldn't load Discord:\n\(error.localizedDescription)\nTap ⚙︎ → Reload", autoHide: nil)
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        showStatus("Page error:\n\(error.localizedDescription)\nTap ⚙︎ → Reload", autoHide: nil)
    }

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
        loadDiscord()
    }
}
