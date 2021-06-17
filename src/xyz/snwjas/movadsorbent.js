/**
 * Aplayer control bar plug-in
 * Which can be used to drag, move, minimize, maximize and close like PC system window.
 */
class Movadsorbent {
	/**
	 * The left/bottom margin of the screen before the player is minimized
	 */
	lastStop = { left: 0, bottom: 0 }

	/**
	 * The left/bottom margin of the current APlayer in the screen
	 */
	curStop = { left: 0, bottom: 0 }

	constructor(aplayer, event = null) {
		this.player = aplayer
		this.event = event

		this.initPlayerStyle()
		this.initControllerBar()
		this.initNote()
		this.initPlayerEvent()
		this.consoleInfo()
	}

	initPlayerStyle() {
		// In order to move without delay, clear the APlyer transition
		document.querySelector('.aplayer-body').style.transition = 'none'
		// Clear playlist border
		document.querySelector('.aplayer-list').style.border = 'none'
	}

	initControllerBar() {
		// Clear the original mini switcher button
		// In order to clear its bound events
		let ctrlBar = document.querySelector('.aplayer-miniswitcher')
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
		ctrlBar.className = 'ctrl-bar'
		ctrlBarParent.appendChild(ctrlBar)
		// Initialize control button
		this.initMinimizeButton(ctrlBar)
		this.initMaximizeButton(ctrlBar)
		this.initCloseButton(ctrlBar)
	}

	initMinimizeButton(parentElem) {
		let elem = document.createElement('span')
		elem.className = 'ctrl-btn minimize'
		elem.addEventListener('click', (event) => {
			this.minimizePlayer()
			event.stopPropagation()
		})
		parentElem.appendChild(elem)
	}

	initMaximizeButton(parentElem) {
		let elem = document.createElement('span')
		elem.className = 'ctrl-btn maximize'
		elem.addEventListener('click', (event) => {
			this.maximizePlayer(event)
			event.stopPropagation()
		})
		parentElem.appendChild(elem)
	}

	initCloseButton(parentElem) {
		let elem = document.createElement('span')
		elem.className = 'ctrl-btn close'
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
		elem.className = 'move-box'
		elem.addEventListener('mousedown', (e) => {
			document.body.style.cursor = 'move'

			let apElem = document.querySelector('.aplayer-fixed')
			let apBodyElem = document.querySelector('.aplayer-body')
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
		let apElem = document.querySelector('.aplayer-fixed')
		let apBodyElem = document.querySelector('.aplayer-body')

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
			this.curStop.bottom = this.lastStop.bottom = bottom
				? bottom : (document.body.clientHeight - this.event.clientY - apElemHeight)
			this.curStop.left = this.lastStop.left = left
				? left : (this.event.clientX - apElemWidth)
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

		let apElem = document.querySelector('.aplayer-fixed')
		let apBodyElem = document.querySelector('.aplayer-body')

		apElem.style.background = 'none'
		apBodyElem.style.transition = 'all .5s ease'
		apElem.style.left = apBodyElem.style.left = '0px'
		apElem.style.bottom = apBodyElem.style.bottom = '0px'

		this.lastStop = { ...this.curStop }
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

		let apElem = document.querySelector('.aplayer-fixed')
		let apBodyElem = document.querySelector('.aplayer-body')

		apBodyElem.style.transition = 'all .5s ease'
		apElem.style.background = '#fff'

		if (this.curStop.left + '' === '0' && this.curStop.bottom + '' === '0') {
			apElem.style.left = apBodyElem.style.left = this.lastStop.left + 'px'
			apElem.style.bottom = apBodyElem.style.bottom = this.lastStop.bottom + 'px'
			this.curStop = { ...this.lastStop }
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
		let note = document.createElement('div')
		note.className = 'note-container'
		// The notes move to the left or to the right
		let animationNamePrefix = this.curStop.left > (document.body.clientWidth >> 1)
			? 'note-move-right' : 'note-move-left'
		// Initialize each note
		for (let i = 1; i < 4; i++) {
			let elem = document.createElement('div')
			elem.id = 'note' + i
			elem.className = 'note'
			elem.innerHTML = '<svg class="icon" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="32" height="32"><path d="M1023.962 64.037c0-43.42-42.2-74.019-83.199-61.019L300.795 192.015c-26.6 8.4-44.8 33-44.8 60.999v522.83c-20.1-4.76-41.439-7.84-63.998-7.84C85.958 768.005 0 825.305 0 896.003S85.958 1024 191.997 1024s191.996-57.299 191.996-127.998V428.631l511.991-150.038v369.254c-20.1-4.76-41.44-7.84-63.999-7.84-106.038 0-191.996 57.299-191.996 127.998s85.958 127.997 191.996 127.997 191.997-57.299 191.997-127.997l-.02-703.968z"/></svg>'
			elem.querySelector('svg path').style.fill = this.randomRGBColor()
			elem.style.animationName = animationNamePrefix + i
			note.appendChild(elem)
		}
		// Add note container element to the APlayer cover
		document.querySelector('.aplayer-pic').appendChild(note)
	}

	/**
	 * Automatic control of notes,
	 * including whether to display notes and the direction of notes
	 */
	noteAutoControl() {
		let noteContainerElem = document.querySelector('.note-container')
		if (noteContainerElem) {
			// Show notes or not
			noteContainerElem.className = this.player.audio.paused
				? 'note-container' : 'note-container playing'
			// The notes move to the left or to the right
			let animationNamePrefix = this.curStop.left > (document.body.clientWidth >> 1)
				? 'note-move-right' : 'note-move-left'
			for (let i = 1; i < 4; i++) {
				let noteElem = document.getElementById('note' + i)
				noteElem.style.animationName = animationNamePrefix + i
				// Fill in random color of notes when playing music
				if (!this.player.audio.paused) {
					noteElem.querySelector('svg path')
						.style.fill = this.randomRGBColor()
				}
			}
		} else {
			this.initNote()
			if (!this.player.audio.paused) {
				document.querySelector('.note-container')
					.className = 'note-container playing'
			}
		}
	}

	setPlayerMode(mode = 'normal') {
		let elem = document.querySelector('.aplayer-list')
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
		return 'rgb(' +
			Math.round(Math.random() * 236) + ',' +
			Math.round(Math.random() * 236) + ',' +
			Math.round(Math.random() * 236) + ')'
	}

	consoleInfo() {
		console.log('\n %c APlayer-Control-Bar-Plugin %c https://github.com/snwjas/Aplayer-ControlBarPlugin \n',
			'color: #fadfa3; background: #030307; padding:5px 0;',
			'background: #fadfa3; padding:5px 0;'
		);
	}
}
