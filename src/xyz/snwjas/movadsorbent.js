/**
 * Aplayer control bar plug-in
 * Which can be used to drag, move, minimize, maximize and close like PC system window.
 */
class Movadsorbent {
	/**
	 * The left/bottom margin of the screen before the player is minimized
	 */
	lastStop = {left: 0, bottom: 0}

	/**
	 * The left/bottom margin of the current APlayer in the screen
	 */
	curStop = {left: 0, bottom: 0}

	/**
	 * @param aplayer Aplayer instance object
	 * @param showNote Whether to display the music note
	 * @param event
	 */
	constructor(aplayer, showNote = true, event = null) {
		this.player = aplayer
		this.showNote = showNote
		this.event = event

		this.initPlayerStyle()
		this.initControllerBar()

		this.initNote()
		this.initPlayerEvent()
		this.consoleInfo()
	}

	initPlayerStyle() {
		// In order to move without delay, clear the APlyer transition
		this.player.container.querySelector('.aplayer-body').style.transition = 'none'
		// Clear playlist border
		this.player.container.querySelector('.aplayer-list').style.border = 'none'
		// Add style
		let css = `.acbp-move-box{width:100%;height:100%;position:absolute;left:0;top:0;cursor:move}.acbp-ctrl-bar{width:100%;height:100%;display:flex;flex-direction:column;justify-content:space-around;align-items:center}.acbp-ctrl-bar .acbp-ctrl-btn{display:inline-block;margin:0 auto;width:10px;height:10px;border-radius:50%;cursor:pointer;flex-shrink:0;z-index:999}.acbp-ctrl-bar .acbp-ctrl-btn.minimize{background-color:#8bd7e2}.acbp-ctrl-bar .acbp-ctrl-btn.minimize:hover{background-color:#00bbcd}.acbp-ctrl-bar .acbp-ctrl-btn.maximize{background-color:#96d6bf}.acbp-ctrl-bar .acbp-ctrl-btn.maximize:hover{background-color:#1bb775}.acbp-ctrl-bar .acbp-ctrl-btn.close{background-color:#e69eb2}.acbp-ctrl-bar .acbp-ctrl-btn.close:hover{background-color:#e42d54}.acbp-note-container{width:30px;height:30px;position:absolute;right:50%;bottom:50%;margin:0 -15px -15px 0}.acbp-note-container.playing .acbp-note{display:block}.acbp-note-container .acbp-note{display:none;opacity:0;width:16px;height:16px;position:absolute;z-index:999}.acbp-note-container .acbp-note .icon{width:100%;height:100%}.acbp-note-container #acbp-note1{animation:acbp-note-move-left1 2s linear 0 infinite normal}@keyframes acbp-note-move-left1{0{left:0;top:0;opacity:0}50%{opacity:1;transform:rotate(9deg)}100%{left:200px;top:-90px;opacity:0}}@keyframes acbp-note-move-right1{0{right:0;top:0;opacity:0}50%{opacity:1;transform:rotate(9deg)}100%{right:200px;top:-90px;opacity:0}}.acbp-note-container #acbp-note2{animation:acbp-note-move-left2 2s linear .4s infinite normal}@keyframes acbp-note-move-left2{0{left:0;top:0;opacity:0}50%{opacity:1;transform:rotate(-9deg)}100%{left:200px;top:-80px;opacity:0}}@keyframes acbp-note-move-right2{0{right:0;top:0;opacity:0}50%{opacity:1;transform:rotate(-9deg)}100%{right:200px;top:-80px;opacity:0}}.acbp-note-container #acbp-note3{animation:acbp-note-move-left3 2s linear .7s infinite normal}@keyframes acbp-note-move-left3{0{left:0;top:0;opacity:0}50%{opacity:1;transform:rotate(9deg)}100%{left:200px;top:-70px;opacity:0}}@keyframes acbp-note-move-right3{0{right:0;top:0;opacity:0}50%{opacity:1;transform:rotate(9deg)}100%{right:200px;top:-70px;opacity:0}}`
		let style = document.createElement('style')
		style.rel = 'stylesheet'
		style.innerHTML = css
		document.head.appendChild(style)
	}

	initControllerBar() {
		// Clear the original mini switcher button
		// In order to clear its bound events
		let ctrlBar = this.player.container.querySelector('.aplayer-miniswitcher')
		let ctrlBarParent = ctrlBar.parentNode || ctrlBar.parentElement
		ctrlBarParent.removeChild(ctrlBar)
		// Recreate the element
		ctrlBar = document.createElement('div')
		ctrlBar.className = 'aplayer-miniswitcher'
		ctrlBarParent = ctrlBarParent.appendChild(ctrlBar)

		// Initialize the APlayer's drag movement
		this.initPlayerMove(ctrlBar)

		// Create the parent element of the control button
		ctrlBar = document.createElement('div')
		ctrlBar.className = 'acbp-ctrl-bar'
		ctrlBarParent.appendChild(ctrlBar)
		// Initialize control button
		this.initMinimizeButton(ctrlBar)
		this.initMaximizeButton(ctrlBar)
		this.initCloseButton(ctrlBar)
	}

	initMinimizeButton(parentElem) {
		let elem = document.createElement('span')
		elem.className = 'acbp-ctrl-btn minimize'
		elem.addEventListener('click', (event) => {
			this.minimizePlayer()
			event.stopPropagation()
		})
		parentElem.appendChild(elem)
	}

	initMaximizeButton(parentElem) {
		let elem = document.createElement('span')
		elem.className = 'acbp-ctrl-btn maximize'
		elem.addEventListener('click', (event) => {
			this.maximizePlayer(event)
			event.stopPropagation()
		})
		parentElem.appendChild(elem)
	}

	initCloseButton(parentElem) {
		let elem = document.createElement('span')
		elem.className = 'acbp-ctrl-btn close'
		elem.addEventListener('click', (event) => {
			this.player.destroy()
			event.stopPropagation()
		})
		parentElem.appendChild(elem)
	}

	/**
	 * Initialize the APlayer's drag movement
	 *
	 * @param parentElem Parent dom element
	 */
	initPlayerMove(parentElem) {
		let elem = document.createElement('div')
		elem.className = 'acbp-move-box'
		elem.addEventListener('mousedown', (e) => {
			document.body.style.cursor = 'move'

			let apElem = this.player.container
			let apBodyElem = this.player.container.querySelector('.aplayer-body')
			// The distance between the APlayer and the left/bottom end of the screen
			// variable as string
			let strLeft = apElem.style.left.replace('px', '') || '0'
			let strBottom = apElem.style.bottom.replace('px', '') || '0'
			// The offset left/bottom of the mouse in the APlayer
			let offsetLeft = e.clientX - parseInt(strLeft)
			let offsetBottom = document.body.clientHeight - e.clientY - parseInt(strBottom)
			window.onmousemove = (e1) => {
				this.movePlayer(e1, apElem, apBodyElem, offsetLeft, offsetBottom)
			}

			window.onmouseup = (e2) => {
				document.body.style.cursor = 'default'
				this.playerStop(e2)
				this.noteAutoControl()
				window.onmousemove = window.onmouseup = undefined
			}
		})
		parentElem.appendChild(elem)
	}

	initPlayerEvent() {
		this.player.on('listshow', () => setTimeout(() => this.playerStop(), 500))
		this.player.on('play', () => this.noteAutoControl())
		this.player.on('pause', () => this.noteAutoControl())
	}

	/**
	 * Drag to move the APlayer
	 *
	 * @param event MouseEvent
	 * @param apElem APlayer container
	 * @param apBodyElem APlayer body container
	 * @param offsetLeft The offset left of the mouse in the APlayer
	 * @param offsetBottom The offset bottom of the mouse in the APlayer
	 */
	movePlayer(event, apElem, apBodyElem, offsetLeft, offsetBottom) {

		this.event = event || window.event || this.event

		let curLeft = this.event.clientX - offsetLeft
		let curBottom = document.body.clientHeight - this.event.clientY - offsetBottom

		this.curStop.left = curLeft
		this.curStop.bottom = curBottom

		apElem.style.left = apBodyElem.style.left = curLeft + 'px'
		apElem.style.bottom = apBodyElem.style.bottom = curBottom + 'px'
	}

	/**
	 * Handle the APlayer's drag and drop movement stop
	 *
	 * @param event MouseEvent
	 */
	playerStop(event) {
		let apElem = this.player.container
		let apBodyElem = this.player.container.querySelector('.aplayer-body')

		let apElemWidth = Math.max(66, apBodyElem.clientWidth) + 18
		let apElemHeight = Math.max(66, apElem.clientHeight)

		// Check the top and bottom margins
		let bottom
		if (this.curStop.bottom < 16) {
			bottom = '0'
		} else if (this.curStop.bottom + apElemHeight + 16 > document.body.clientHeight) {
			bottom = document.body.clientHeight - apElemHeight
		}
		if (bottom) apElem.style.bottom = apBodyElem.style.bottom = bottom + 'px'

		// Check Left and right margins
		let left
		if (this.curStop.left < 16) {
			left = '0'
		} else if (this.curStop.left + apElemWidth + 16 > document.body.clientWidth) {
			left = document.body.clientWidth - apElemWidth + 18
		}
		if (left) apElem.style.left = apBodyElem.style.left = left + 'px'

		// Whether to adsorb
		if (bottom || left) {
			this.event = event || window.event || this.event
			this.curStop.bottom = this.lastStop.bottom = bottom ? bottom : (document.body.clientHeight - this.event.clientY - apElemHeight)
			this.curStop.left = this.lastStop.left = left ? left : (this.event.clientX - apElemWidth)
		}
	}

	/**
	 * Minimize the APlayer
	 */
	minimizePlayer() {
		this.setPlayerMode('mini')

		if (this.curStop.left + '' === '0' && this.curStop.bottom + '' === '0') {
			return
		}

		let apElem = this.player.container
		let apBodyElem = this.player.container.querySelector('.aplayer-body')

		apElem.style.background = 'none'
		apBodyElem.style.transition = 'all .5s ease'
		apElem.style.left = apBodyElem.style.left = '0px'
		apElem.style.bottom = apBodyElem.style.bottom = '0px'

		this.lastStop = {...this.curStop}
		this.curStop.left = this.curStop.bottom = 0

		setTimeout(() => {
			apBodyElem.style.transition = 'none'
			this.noteAutoControl()
		}, 500);
	}

	/**
	 * Maximize the APlayer
	 */
	maximizePlayer(event) {
		this.setPlayerMode(this.player.mode === 'mini' ? 'normal' : 'mini')

		let apElem = this.player.container
		let apBodyElem = this.player.container.querySelector('.aplayer-body')

		apBodyElem.style.transition = 'all .5s ease'
		apElem.style.background = '#fff'

		if (this.curStop.left + '' === '0' && this.curStop.bottom + '' === '0') {
			apElem.style.left = apBodyElem.style.left = this.lastStop.left + 'px'
			apElem.style.bottom = apBodyElem.style.bottom = this.lastStop.bottom + 'px'
			this.curStop = {...this.lastStop}
		}

		setTimeout(() => {
			apBodyElem.style.transition = 'none'
			this.noteAutoControl()
			this.playerStop(event)
		}, 500);
	}

	/**
	 * Initialize the floating music symbol
	 */
	initNote() {
		if (!this.showNote) {
			return
		}
		let note = document.createElement('div')
		note.className = 'acbp-note-container'
		// The notes move to the left or to the right
		let animationNamePrefix = this.curStop.left > (document.body.clientWidth >> 1) ? 'acbp-note-move-right' : 'acbp-note-move-left'
		// Initialize each note
		for (let i = 1; i < 4; i++) {
			let elem = document.createElement('div')
			elem.id = 'acbp-note' + i
			elem.className = 'acbp-note'
			elem.innerHTML = '<svg class="icon" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="32" height="32"><path d="M1023.962 64.037c0-43.42-42.2-74.019-83.199-61.019L300.795 192.015c-26.6 8.4-44.8 33-44.8 60.999v522.83c-20.1-4.76-41.439-7.84-63.998-7.84C85.958 768.005 0 825.305 0 896.003S85.958 1024 191.997 1024s191.996-57.299 191.996-127.998V428.631l511.991-150.038v369.254c-20.1-4.76-41.44-7.84-63.999-7.84-106.038 0-191.996 57.299-191.996 127.998s85.958 127.997 191.996 127.997 191.997-57.299 191.997-127.997l-.02-703.968z"/></svg>'
			elem.querySelector('svg path').style.fill = this.randomRGBColor()
			elem.style.animationName = animationNamePrefix + i
			note.appendChild(elem)
		}
		// Add note container element to the APlayer cover
		this.player.container.querySelector('.aplayer-pic').appendChild(note)
	}

	/**
	 * Automatic control of notes,
	 * including whether to display notes and the direction of notes
	 */
	noteAutoControl() {
		if (!this.showNote) {
			return
		}
		let noteContainerElem = this.player.container.querySelector('.acbp-note-container')
		if (noteContainerElem) {
			// Show notes or not
			noteContainerElem.className = this.player.audio.paused ? 'acbp-note-container' : 'acbp-note-container playing'
			// The notes move to the left or to the right
			let animationNamePrefix = this.curStop.left > (document.body.clientWidth >> 1) ? 'acbp-note-move-right' : 'acbp-note-move-left'
			for (let i = 1; i < 4; i++) {
				let noteElem = document.getElementById('acbp-note' + i)
				noteElem.style.animationName = animationNamePrefix + i
				// Fill in random color of notes when playing music
				if (!this.player.audio.paused) {
					noteElem.querySelector('svg path').style.fill = this.randomRGBColor()
				}
			}
		} else {
			this.initNote()
			if (!this.player.audio.paused) {
				this.player.container.querySelector('.acbp-note-container').className = 'acbp-note-container playing'
			}
		}
	}

	setPlayerMode(mode = 'normal') {
		let elem = this.player.container.querySelector('.aplayer-list')
		let elemc = elem.querySelector('ol')
		elem.style.display = 'block'
		if (mode === 'normal') {
			let mh = this.player.options.listMaxHeight
			elem.style.maxHeight = mh || '250px'
			elemc.style.maxHeight = mh || '250px'
		} else {
			elem.style.maxHeight = '0px'
			elemc.style.maxHeight = '0px'
		}
		this.player.setMode(mode)
	}

	randomRGBColor() {
		return 'rgb(' + Math.round(Math.random() * 236) + ',' + Math.round(Math.random() * 236) + ',' + Math.round(Math.random() * 236) + ')'
	}

	consoleInfo() {
		console.log('\n %c APlayer-Control-Bar-Plugin %c https://github.com/snwjas/Aplayer-ControlBarPlugin \n', 'color: #fadfa3; background: #030307; padding:5px 0;', 'background: #fadfa3; padding:5px 0;');
	}
}
