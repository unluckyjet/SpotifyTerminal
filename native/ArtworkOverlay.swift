import AppKit
import ApplicationServices
import MediaPlayer

struct CellRect: Codable { var x: Double; var y: Double; var width: Double; var height: Double }
struct Anchor: Codable { var text: String; var x: Double; var y: Double }
struct NowPlaying: Codable {
    var id:String; var name:String; var artist:String; var album:String
    var duration:Double; var position:Double; var playing:Bool; var volume:Int; var shuffle:Bool
}
struct Frame: Codable {
    var key: String
    var enabled: Bool
    var token: String
    var image: String?
    var cover: CellRect
    var anchor: Anchor
    var background: String
    var track: NowPlaying? = nil
    var menuBar: Bool? = nil
    var clearImage: Bool? = nil
    var systemMedia: Bool? = nil
    var playbackImage:String?=nil
    var clearPlaybackImage:Bool?=nil
    var transitions:Bool?=nil
}

func attribute(_ element: AXUIElement, _ name: String) -> CFTypeRef? {
    var result: CFTypeRef?
    return AXUIElementCopyAttributeValue(element, name as CFString, &result) == .success ? result : nil
}
func rect(_ element: AXUIElement) -> CGRect? {
    guard let p = attribute(element, kAXPositionAttribute), let s = attribute(element, kAXSizeAttribute),
          CFGetTypeID(p) == AXValueGetTypeID(), CFGetTypeID(s) == AXValueGetTypeID() else { return nil }
    var origin = CGPoint.zero; var size = CGSize.zero
    guard AXValueGetValue(p as! AXValue, .cgPoint, &origin), AXValueGetValue(s as! AXValue, .cgSize, &size) else { return nil }
    return CGRect(origin: origin, size: size)
}
func bounds(_ element: AXUIElement, _ range: NSRange) -> CGRect? {
    var rangeValue = CFRange(location: range.location, length: range.length)
    guard let parameter = AXValueCreate(.cfRange, &rangeValue) else { return nil }
    var result: CFTypeRef?
    guard AXUIElementCopyParameterizedAttributeValue(element, kAXBoundsForRangeParameterizedAttribute as CFString, parameter, &result) == .success,
          let result, CFGetTypeID(result) == AXValueGetTypeID() else { return nil }
    var rectangle = CGRect.zero
    guard AXValueGetValue(result as! AXValue, .cgRect, &rectangle) else { return nil }
    return rectangle
}
func coverRectangle(bar: CGRect, frame: Frame) -> CGRect? {
    let count = (frame.anchor.text as NSString).length
    guard count > 0, bar.width.isFinite, bar.height.isFinite, bar.minX.isFinite, bar.minY.isFinite,
          bar.width > 0, bar.height >= 4, bar.height <= 100 else { return nil }
    let cw = bar.width / Double(count), ch = bar.height
    guard cw >= 2, cw <= 100, frame.cover.width > 0, frame.cover.height > 0 else { return nil }
    return CGRect(x: bar.minX + (frame.cover.x-frame.anchor.x)*cw,
                  y: bar.minY + (frame.cover.y-frame.anchor.y)*ch,
                  width: frame.cover.width*cw, height: frame.cover.height*ch)
}

final class PhotoView: NSView {
    var transitions=false
    var previous:NSImage?
    var transitionStarted=Date.distantPast
    var image: NSImage? { didSet {
        if transitions,image != nil,oldValue != nil {previous=oldValue;transitionStarted=Date()} else {previous=nil}
        needsDisplay=true
    }}
    var backdrop = NSColor.black { didSet { needsDisplay = true } }
    override func draw(_ dirtyRect: NSRect) {
        backdrop.setFill(); bounds.fill()
        guard let image, image.size.width > 0, image.size.height > 0 else { return }
        let scale = min(bounds.width/image.size.width, bounds.height/image.size.height)
        let size = CGSize(width:image.size.width*scale,height:image.size.height*scale)
        let target = CGRect(x:(bounds.width-size.width)/2,y:(bounds.height-size.height)/2,width:size.width,height:size.height)
        NSGraphicsContext.current?.imageInterpolation = .high
        let fraction=transitions ? min(1,Date().timeIntervalSince(transitionStarted)/0.4) : 1
        if fraction<1,let previous {previous.draw(in:target,from:.zero,operation:.sourceOver,fraction:1,respectFlipped:true,hints:nil)}
        image.draw(in:target,from:.zero,operation:.sourceOver,fraction:fraction,respectFlipped:true,hints:nil)
        if fraction>=1 {previous=nil}
    }
}
final class ArtPanel: NSPanel {
    override var canBecomeKey: Bool { false }
    override var canBecomeMain: Bool { false }
}
final class Overlay: NSObject, NSApplicationDelegate {
    let panel = ArtPanel(contentRect:.zero,styleMask:[.borderless,.nonactivatingPanel],backing:.buffered,defer:false)
    let photo = PhotoView()
    var frame: Frame?
    var updated = Date.distantPast
    var geometryChanged = Date.distantPast
    let parent: pid_t = getppid()
    var playbackImage:NSImage?
    var remoteTargets:[(MPRemoteCommand,Any)]=[]
    var mediaActive=false
    var lastMediaUpdate=Date.distantPast
    var mediaIdentity=""
    func configureMedia() {
        let center=MPRemoteCommandCenter.shared()
        for (remote,name) in [(center.playCommand,"play"),(center.pauseCommand,"pause"),(center.togglePlayPauseCommand,"toggle"),(center.nextTrackCommand,"next"),(center.previousTrackCommand,"previous")] {
            remote.isEnabled=true
            let target=remote.addTarget { [weak self] _ in
                guard let self,self.frame?.systemMedia==true,Date().timeIntervalSince(self.updated)<2 else { return .commandFailed }
                self.command(name);return .success
            }
            remoteTargets.append((remote,target))
        }
        center.changePlaybackPositionCommand.isEnabled=true
        let remote=center.changePlaybackPositionCommand
        let target=remote.addTarget { [weak self] event in
            guard let self,self.frame?.systemMedia==true,Date().timeIntervalSince(self.updated)<2,
                  let event=event as? MPChangePlaybackPositionCommandEvent,event.positionTime.isFinite,event.positionTime>=0 else { return .commandFailed }
            if let data=try? JSONSerialization.data(withJSONObject:["command":"seek","position":event.positionTime]),let text=String(data:data,encoding:.utf8){print(text);fflush(stdout)}
            return .success
        }
        remoteTargets.append((remote,target));mediaActive=true
    }
    func clearMedia() {
        for (command,target) in remoteTargets {command.removeTarget(target);command.isEnabled=false}
        remoteTargets=[]
        if mediaActive {MPNowPlayingInfoCenter.default().nowPlayingInfo=nil;MPNowPlayingInfoCenter.default().playbackState = .stopped}
        mediaActive=false;mediaIdentity=""
    }
    func updateMedia(_ state:Frame) {
        guard state.systemMedia==true,let track=state.track,!track.id.isEmpty else {clearMedia();return}
        if !mediaActive {configureMedia()}
        let identity="\(track.id):\(track.playing):\(state.image != nil)"
        guard identity != mediaIdentity || Date().timeIntervalSince(lastMediaUpdate)>=1 else {return}
        mediaIdentity=identity;lastMediaUpdate=Date()
        var info:[String:Any]=[
            MPMediaItemPropertyTitle:track.name,MPMediaItemPropertyArtist:track.artist,MPMediaItemPropertyAlbumTitle:track.album,
            MPMediaItemPropertyPlaybackDuration:track.duration,MPNowPlayingInfoPropertyElapsedPlaybackTime:track.position,
            MPNowPlayingInfoPropertyPlaybackRate:track.playing ? 1.0 : 0.0,MPNowPlayingInfoPropertyDefaultPlaybackRate:1.0,
            MPNowPlayingInfoPropertyExternalContentIdentifier:track.id
        ]
        if let image=playbackImage {info[MPMediaItemPropertyArtwork]=MPMediaItemArtwork(boundsSize:image.size) { _ in image }}
        let center=MPNowPlayingInfoCenter.default();center.nowPlayingInfo=info
        center.playbackState=track.playing ? .playing : .paused
    }
    func applicationWillTerminate(_ notification:Notification){clearMedia()}
    var statusItem: NSStatusItem?
    let statusMenu=NSMenu()
    let titleItem=NSMenuItem(title:"Spotterminal",action:nil,keyEquivalent:"")
    let artistItem=NSMenuItem(title:"Connecting…",action:nil,keyEquivalent:"")
    let albumItem=NSMenuItem(title:"",action:nil,keyEquivalent:"")
    let playItem=NSMenuItem(title:"Play / Pause",action:#selector(menuAction(_:)),keyEquivalent:"")
    let shuffleItem=NSMenuItem(title:"Shuffle",action:#selector(menuAction(_:)),keyEquivalent:"")

    func command(_ name:String) {
        guard let data=try? JSONSerialization.data(withJSONObject:["command":name]),let text=String(data:data,encoding:.utf8) else { return }
        print(text);fflush(stdout)
    }
    @objc func menuAction(_ item:NSMenuItem) { if let action=item.representedObject as? String { command(action) } }
    func menuItem(_ title:String,_ command:String)->NSMenuItem {
        let item=NSMenuItem(title:title,action:#selector(menuAction(_:)),keyEquivalent:"")
        item.target=self;item.representedObject=command
        return item
    }
    func configureMenu() {
        statusMenu.autoenablesItems=false
        for item in [titleItem,artistItem,albumItem] { item.isEnabled=false;statusMenu.addItem(item) }
        statusMenu.addItem(.separator())
        playItem.target=self;playItem.representedObject="toggle";statusMenu.addItem(playItem)
        statusMenu.addItem(menuItem("Previous Track","previous"));statusMenu.addItem(menuItem("Next Track","next"))
        shuffleItem.target=self;shuffleItem.representedObject="shuffle";statusMenu.addItem(shuffleItem)
        statusMenu.addItem(.separator());statusMenu.addItem(menuItem("Volume Up","louder"));statusMenu.addItem(menuItem("Volume Down","quieter"))
        statusMenu.addItem(.separator());statusMenu.addItem(menuItem("Quit Spotterminal","quit"))
    }
    func updateMenu(_ state:Frame) {
        if state.menuBar==false {
            if let item=statusItem { NSStatusBar.system.removeStatusItem(item);statusItem=nil }
            return
        }
        if statusItem==nil {
            let item=NSStatusBar.system.statusItem(withLength:NSStatusItem.squareLength)
            item.button?.image=NSImage(systemSymbolName:"music.note",accessibilityDescription:"Spotterminal")
            item.button?.image?.isTemplate=true;item.menu=statusMenu;statusItem=item
        }
        guard let track=state.track else { return }
        titleItem.title=track.name;artistItem.title=track.artist;albumItem.title=track.album
        playItem.title=track.playing ? "Pause" : "Play"
        shuffleItem.state=track.shuffle ? .on : .off
        statusItem?.button?.toolTip="\(track.name) — \(track.artist)"
    }
    let allowed = Set(["com.apple.Terminal","com.googlecode.iterm2","com.mitchellh.ghostty","net.kovidgoyal.kitty","org.wezfurlong.wezterm"])

    func applicationDidFinishLaunching(_ notification: Notification) {
        NSApp.setActivationPolicy(.accessory)
        configureMenu()
        AXUIElementSetMessagingTimeout(AXUIElementCreateSystemWide(),0.15)
        panel.contentView=photo; panel.isOpaque=true; panel.hasShadow=false
        panel.ignoresMouseEvents=true; panel.hidesOnDeactivate=false
        panel.level = .floating
        panel.collectionBehavior = [.canJoinAllSpaces,.fullScreenAuxiliary,.ignoresCycle]
        panel.isReleasedWhenClosed=false
        DispatchQueue.global(qos:.userInitiated).async { [weak self] in
            while let line=readLine() {
                guard let data=line.data(using:.utf8), let update=try? JSONDecoder().decode(Frame.self,from:data) else { continue }
                DispatchQueue.main.async { self?.receive(update) }
            }
            DispatchQueue.main.async { NSApp.terminate(nil) }
        }
        Timer.scheduledTimer(withTimeInterval:0.1,repeats:true) { [weak self] _ in self?.tick() }
    }
    func receive(_ update: Frame) {
        photo.transitions=update.transitions==true
        if frame?.key != update.key {
            panel.orderOut(nil)
            geometryChanged=Date()
        }
        if let encoded=update.image {
            photo.image=Data(base64Encoded:encoded).flatMap { NSImage(data:$0) }
        }

        if update.clearImage==true { photo.image=nil }
        if let encoded=update.playbackImage {playbackImage=Data(base64Encoded:encoded).flatMap {NSImage(data:$0)}}
        if update.clearPlaybackImage==true {playbackImage=nil}
        updateMenu(update)
        updateMedia(update)
        let value=UInt32(update.background.dropFirst(),radix:16) ?? 0
        photo.backdrop=NSColor(srgbRed:Double((value>>16)&255)/255,green:Double((value>>8)&255)/255,blue:Double(value&255)/255,alpha:1)
        frame=update; updated=Date(); tick()
    }
    func report(_ visible: Bool, _ reason: String) {
        let key=frame?.key ?? ""
        if let data=try? JSONSerialization.data(withJSONObject:["visible":visible,"reason":reason,"key":key]),let text=String(data:data,encoding:.utf8) {
            print(text); fflush(stdout)
        }
    }
    func hide(_ reason: String) { panel.orderOut(nil); report(false,reason) }
    func tick() {
        if photo.previous != nil {photo.needsDisplay=true}
        guard kill(parent,0)==0 else { NSApp.terminate(nil); return }
        guard let frame,frame.enabled,Date().timeIntervalSince(updated)<1.5,photo.image != nil else { hide("idle");return }
        guard Date().timeIntervalSince(geometryChanged)>0.15 else { hide("settling");return }
        guard AXIsProcessTrusted() else { hide("accessibility");return }
        guard let front=NSWorkspace.shared.frontmostApplication,let bundle=front.bundleIdentifier,allowed.contains(bundle) else { hide("background");return }
        let application=AXUIElementCreateApplication(front.processIdentifier)
        AXUIElementSetMessagingTimeout(application,0.15)
        guard let rawWindow=attribute(application,kAXFocusedWindowAttribute),CFGetTypeID(rawWindow)==AXUIElementGetTypeID() else { hide("window");return }
        let window=rawWindow as! AXUIElement
        guard let title=attribute(window,kAXTitleAttribute) as? String,title.contains(frame.token),
              (attribute(window,kAXMinimizedAttribute) as? Bool) != true else { hide("other-tab");return }
        var queue:[(AXUIElement,CGRect?)]=[(window,rect(window))]
        var inspected=0
        var placement:CGRect?
        while !queue.isEmpty && inspected<180 {
            let (element,clip)=queue.removeFirst();inspected+=1
            let role=attribute(element,kAXRoleAttribute) as? String ?? ""
            var visible=clip
            if (role==kAXScrollAreaRole || role==kAXTextAreaRole),let r=rect(element) { visible=visible?.intersection(r) ?? r }
            if role==kAXTextAreaRole,let text=attribute(element,kAXValueAttribute) as? String {
                let string=text as NSString
                var searchRange=NSRange(location:0,length:0)
                if let value=attribute(element,kAXVisibleCharacterRangeAttribute),CFGetTypeID(value)==AXValueGetTypeID(){
                    var visibleRange=CFRange()
                    if AXValueGetValue(value as! AXValue,.cfRange,&visibleRange),visibleRange.location>=0,visibleRange.length>=0,
                       visibleRange.location+visibleRange.length<=string.length {
                        searchRange=NSRange(location:visibleRange.location,length:visibleRange.length)
                    }
                }
                let range=string.range(of:frame.anchor.text,options:.backwards,range:searchRange)
                let exactRun=range.location != NSNotFound
                    && (range.location==0 || string.substring(with:NSRange(location:range.location-1,length:1)) != "─")
                    && (range.location+range.length==string.length || string.substring(with:NSRange(location:range.location+range.length,length:1)) != "─")
                if exactRun, let first=bounds(element,NSRange(location:range.location,length:1)),
                   let last=bounds(element,NSRange(location:range.location+range.length-1,length:1)),
                   abs(first.minY-last.minY)<1,abs(first.height-last.height)<1 {
                    let bar=first.union(last)
                    if let target=coverRectangle(bar:bar,frame:frame),let viewport=visible,
                       viewport.insetBy(dx:-1,dy:-1).contains(bar),viewport.insetBy(dx:-1,dy:-1).contains(target) {
                        placement=target;break
                    }
                }
            }
            let children=attribute(element,kAXChildrenAttribute) as? [AXUIElement] ?? []
            queue.append(contentsOf:children.map { ($0,visible) })
        }
        guard let target=placement else { hide("anchor");return }
        // Recheck focus after reading accessibility geometry.
        guard NSWorkspace.shared.frontmostApplication?.processIdentifier==front.processIdentifier,
              let focusedNow=attribute(application,kAXFocusedWindowAttribute),CFEqual(focusedNow,window),
              let titleNow=attribute(window,kAXTitleAttribute) as? String,titleNow.contains(frame.token) else { hide("background");return }
        let desktopTop=NSScreen.screens.first?.frame.maxY ?? 0
        panel.setFrame(CGRect(x:target.minX,y:desktopTop-target.maxY,width:target.width,height:target.height),display:true)
        panel.orderFrontRegardless()
        report(true,"shown")
    }
}

if CommandLine.arguments.contains("--check") {
    print("{\"accessibility\":\(AXIsProcessTrusted())}")
    exit(0)
}
if CommandLine.arguments.contains("--request-accessibility") {
    _ = AXIsProcessTrustedWithOptions([kAXTrustedCheckOptionPrompt.takeUnretainedValue() as String:true] as CFDictionary)
    exit(0)
}
if CommandLine.arguments.contains("--self-test") {
    let input=Frame(key:"test",enabled:true,token:"test",image:nil,cover:CellRect(x:20,y:6,width:40,height:20),anchor:Anchor(text:String(repeating:"─",count:64),x:8,y:27),background:"#000000")
    let output=coverRectangle(bar:CGRect(x:100,y:600,width:640,height:20),frame:input)!
    precondition(output==CGRect(x:220,y:180,width:400,height:400))
    precondition(coverRectangle(bar:.zero,frame:input)==nil)
    print("Overlay geometry tests passed")
    exit(0)
}
if CommandLine.arguments.contains("--render-test"),CommandLine.arguments.count==4 {
    _ = NSApplication.shared
    guard let image=NSImage(contentsOfFile:CommandLine.arguments[2]),
          let bitmap=NSBitmapImageRep(bitmapDataPlanes:nil,pixelsWide:600,pixelsHigh:600,bitsPerSample:8,samplesPerPixel:4,hasAlpha:true,isPlanar:false,colorSpaceName:.deviceRGB,bytesPerRow:0,bitsPerPixel:0),
          let context=NSGraphicsContext(bitmapImageRep:bitmap) else { exit(1) }
    let view=PhotoView(frame:CGRect(x:0,y:0,width:600,height:600));view.image=image
    NSGraphicsContext.saveGraphicsState();NSGraphicsContext.current=context
    view.draw(view.bounds)
    NSGraphicsContext.restoreGraphicsState()
    guard let png=bitmap.representation(using:.png,properties:[:]) else { exit(1) }
    try png.write(to:URL(fileURLWithPath:CommandLine.arguments[3]))
    print("Native artwork rendered")
    exit(0)
}
let app=NSApplication.shared
let delegate=Overlay()
app.delegate=delegate
app.run()
