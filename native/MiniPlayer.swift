import AppKit

// A normal independent window: artwork never depends on terminal accessibility.
final class MiniPlayer: NSObject, NSWindowDelegate {
    let window=NSPanel(contentRect:NSRect(x:0,y:0,width:320,height:492),styleMask:[.titled,.closable,.utilityWindow,.nonactivatingPanel],backing:.buffered,defer:false)
    let content=NSView(frame:NSRect(x:0,y:0,width:320,height:492))
    let photo=PhotoView(frame:NSRect(x:16,y:112,width:288,height:288))
    let title=NSTextField(labelWithString:"Connecting to Spotify…")
    let album=NSTextField(labelWithString:"")
    let artist=NSTextField(labelWithString:"")
    let elapsed=NSTextField(labelWithString:"0:00")
    let duration=NSTextField(labelWithString:"0:00")
    let slider=NSSlider(value:0,minValue:0,maxValue:1,target:nil,action:nil)
    let play=NSButton(title:"Play",target:nil,action:nil)
    var buttons:[NSButton]=[]
    var lastImage:NSImage?
    var requested=false
    var send:(String,Double?)->Void
    init(send:@escaping (String,Double?)->Void) {
        self.send=send
        super.init()
        window.appearance=NSAppearance(named:.darkAqua)
        window.title="Spotterminal";window.contentView=content;window.delegate=self
        window.isReleasedWhenClosed=false;window.hidesOnDeactivate=false;window.level = .floating
        window.collectionBehavior=[.canJoinAllSpaces,.fullScreenAuxiliary]
        window.isMovableByWindowBackground=true;window.setFrameAutosaveName("SpotterminalMiniPlayer")
        if window.frame.origin == .zero {window.center()}
        content.wantsLayer=true;content.addSubview(photo)
        for (label,y,size) in [(title,461.0,16.0),(album,440.0,12.0),(artist,419.0,12.0)] {
            label.frame=NSRect(x:16,y:y,width:288,height:22);label.alignment = .center
            label.font = .systemFont(ofSize:size,weight:label === title ? .semibold : .regular)
            label.lineBreakMode = .byTruncatingTail;content.addSubview(label)
        }
        slider.frame=NSRect(x:14,y:81,width:292,height:20);slider.target=self;slider.action=#selector(seek(_:));slider.isContinuous=false
        slider.setAccessibilityLabel("Playback position");content.addSubview(slider)
        for (label,x) in [(elapsed,16.0),(duration,240.0)] {
            label.frame=NSRect(x:x,y:60,width:64,height:18)
            label.font = .monospacedDigitSystemFont(ofSize:11,weight:.regular)
            label.alignment=label === duration ? .right : .left;content.addSubview(label)
        }
        for (button,name,symbol,x) in [(NSButton(),"previous","backward.end.fill",56.0),(play,"toggle","play.fill",136.0),(NSButton(),"next","forward.end.fill",216.0)] {
            button.frame=NSRect(x:x,y:14,width:48,height:32);button.bezelStyle = .rounded
            button.image=NSImage(systemSymbolName:symbol,accessibilityDescription:name)
            button.isBordered=false;button.contentTintColor = .white
            button.imagePosition = .imageOnly;button.identifier=NSUserInterfaceItemIdentifier(name)
            button.target=self;button.action=#selector(transport(_:));button.toolTip=name == "toggle" ? "Play / pause" : name.capitalized
            content.addSubview(button);buttons.append(button)
        }
    }
    @objc func transport(_ button:NSButton){if let name=button.identifier?.rawValue {send(name,nil)}}
    @objc func seek(_ slider:NSSlider){send("seek",slider.doubleValue)}
    func windowShouldClose(_ sender:NSWindow)->Bool {requested=false;window.orderOut(nil);send("hide-mini",nil);return false}
    func update(_ state:Frame,image:NSImage?,background:NSColor){
        if state.mini != true {requested=false;window.orderOut(nil);return}
        if !requested {requested=true;window.orderFrontRegardless()}
        content.layer?.backgroundColor=background.cgColor;window.backgroundColor=background;photo.backdrop=background
        photo.transitions=state.transitions==true
        if image !== lastImage {photo.image=image;lastImage=image}
        guard let track=state.track else {return}
        title.stringValue=track.name;album.stringValue=track.album;artist.stringValue=track.artist
        for label in [title,album,artist] {label.toolTip=label.stringValue}
        for label in [title,album,artist,elapsed,duration] {label.textColor=background.blended(withFraction:label === title ? 0.96 : 0.75,of:.white)}
        for button in buttons {button.contentTintColor=background.blended(withFraction:0.9,of:.white)}
        elapsed.stringValue=Self.time(track.position);duration.stringValue=Self.time(track.duration)
        slider.maxValue=max(1,track.duration)
        if slider.cell?.isHighlighted != true {slider.doubleValue=min(slider.maxValue,max(0,track.position))}
        play.image=NSImage(systemSymbolName:track.playing ? "pause.fill" : "play.fill",accessibilityDescription:track.playing ? "Pause" : "Play")
        play.toolTip=track.playing ? "Pause" : "Play"
        for button in buttons {button.isEnabled = !track.id.isEmpty}
        slider.isEnabled=track.duration>0
    }
    func tick(fresh:Bool){
        if photo.previous != nil {photo.needsDisplay=true}
        if !fresh {for button in buttons {button.isEnabled=false};slider.isEnabled=false}
    }
    static func time(_ seconds:Double)->String {
        guard seconds.isFinite else {return "0:00"}
        let value=Int(max(0,seconds));return String(format:"%d:%02d",value/60,value%60)
    }
}
