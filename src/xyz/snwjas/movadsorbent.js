/**
 * 移动和吸附
 */
class Movadsorbent {
	/**
	 * 上一次停靠的坐标
	 */
	lastStop = { left: 0, bottom: 0 }
	/**
	 * 播放器坐标
	 */
	nowStop = { left: 0, bottom: 0 }

	constructor(aplayer, event = null) {
		this.player = aplayer
		this.event = event

		this.initPlayerStyle()
		this.initController()
		this.initNote()
		this.initPlayerEvent()
	}

	initPlayerStyle() {
		// 清除过渡动画，否则移动可能卡顿
		document.querySelector('.aplayer-body').style.transition = 'none'
		// 清除播放列表边框
		document.querySelector('.aplayer-list').style.border = 'none'
	}

	initController() {
		// 清除原来的展开按钮（清除绑定事件）
		let ctrlBar = document.querySelector('.aplayer-miniswitcher')
		let ctrlBarParent = ctrlBar.parentNode || ctrlBar.parentElement
		ctrlBarParent.removeChild(ctrlBar)
		// 重新添加
		ctrlBar = document.createElement('div')
		ctrlBar.className = 'aplayer-miniswitcher'
		ctrlBarParent = ctrlBarParent.appendChild(ctrlBar)

		// 初始化拖拽
		this.initPlayerMove(ctrlBar)

		// 添加控制按钮元素(flex)
		ctrlBar = document.createElement('div')
		ctrlBar.className = 'ctrl-bar'
		ctrlBarParent.appendChild(ctrlBar)
		// 初始化按钮
		this.initMinimizeButton(ctrlBar)
		this.initMaximizeButton(ctrlBar)
		this.initCloseButton(ctrlBar)
	}

	initMinimizeButton(parentElem) {
		let elem = document.createElement('span')
		elem.className = 'ctrl-btn minimize'
		parentElem.appendChild(elem)
		elem.addEventListener('click', function (event) {
			event.stopPropagation()
			this.minimizePlayer()
		}.bind(this))
	}

	initMaximizeButton(parentElem) {
		let elem = document.createElement('span')
		elem.className = 'ctrl-btn maximize'
		parentElem.appendChild(elem)
		elem.addEventListener('click', function (event) {
			event.stopPropagation()
			this.maximizePlayer(event)
		}.bind(this))
	}

	initCloseButton(parentElem) {
		let elem = document.createElement('span')
		elem.className = 'ctrl-btn close'
		parentElem.appendChild(elem)
		elem.addEventListener('click', function (event) {
			event.stopPropagation()
			this.player.destroy()
		}.bind(this))
	}

	initPlayerMove(parentElem) {
		let elem = document.createElement('div')
		elem.className = 'move-box'
		parentElem.appendChild(elem)
		elem.addEventListener('mousedown', function () {
			document.body.style.cursor = 'move'
			window.onmousemove = function (event) {
				this.movePlayer(event)
			}.bind(this)
			window.onmouseup = function (event) {
				document.body.style.cursor = 'default'
				this.playerStop(event)
				this.noteShowHidden()
				window.onmousemove = window.onmouseup = undefined
			}.bind(this)
		}.bind(this))
	}

	initPlayerEvent() {
		this.player.on('listshow', function () {
			setTimeout(function () {
				this.playerStop()
			}.bind(this), 500);
		}.bind(this))
		this.player.on('play', function () {
			this.noteShowHidden()
		}.bind(this))
		this.player.on('pause', function () {
			this.noteShowHidden()
		}.bind(this))
	}

	/**
	 * 移动播放器
	 */
	movePlayer(event) {
		let apElem = document.querySelector('.aplayer-fixed')
		let apBodyElem = document.querySelector('.aplayer-body')

		let apElemWidth = Math.max(66, apBodyElem.clientWidth) + 18
		let apElemHeight = Math.max(66, apElem.clientHeight) >> 1

		this.event = event || window.event || this.event
		let curLeft = (this.event.clientX - apElemWidth)
		let curBottom = (document.body.clientHeight - this.event.clientY - apElemHeight)
		this.nowStop.left = curLeft
		this.nowStop.bottom = curBottom

		apElem.style.left = apBodyElem.style.left = curLeft + 'px'
		apElem.style.bottom = apBodyElem.style.bottom = curBottom + 'px'
	}

	/**
	 * 播放器停靠处理
	 */
	playerStop(event) {
		let apElem = document.querySelector('.aplayer-fixed')
		let apBodyElem = document.querySelector('.aplayer-body')

		let apElemWidth = Math.max(66, apBodyElem.clientWidth) + 18
		let apElemHeight = Math.max(66, apElem.clientHeight)

		// 处理底边距
		let bottom = null
		if (this.nowStop.bottom < 16) {
			bottom = '0'
		} else if (this.nowStop.bottom + apElemHeight + 16 > document.body.clientHeight) {
			bottom = document.body.clientHeight - apElemHeight
		}
		if (bottom) apElem.style.bottom = apBodyElem.style.bottom = bottom + 'px'

		// 处理左边距
		let left = null;
		if (this.nowStop.left < 16) {
			left = '0'
		} else if (this.nowStop.left + apElemWidth + 36 > document.body.clientWidth) {
			left = (document.body.clientWidth << 1) - window.innerWidth - apElemWidth + 18
		}
		if (left) apElem.style.left = apBodyElem.style.left = left + 'px'

		// 判断是否吸附
		if (bottom || left) {
			this.event = event || window.event || this.event
			this.nowStop.left = this.lastStop.left = left ? left
				: (this.event.clientX - apElemWidth)
			this.nowStop.bottom = this.lastStop.bottom = bottom ? bottom
				: (document.body.clientHeight - this.event.clientY - apElemHeight)
		}
	}

	/**
	 * 最小化播放器
	 */
	minimizePlayer() {
		this.setPlayerMode('mini')

		if (this.nowStop.left + '' === '0' && this.nowStop.bottom + '' === '0') {
			return
		}

		let apElem = document.querySelector('.aplayer-fixed')
		let apBodyElem = document.querySelector('.aplayer-body')

		apElem.style.background = 'none'
		apBodyElem.style.transition = 'all .5s ease'
		apElem.style.left = apBodyElem.style.left = '0px'
		apElem.style.bottom = apBodyElem.style.bottom = '0px'

		this.lastStop = { ...this.nowStop }
		this.nowStop.left = this.nowStop.bottom = 0

		setTimeout(function () {
			apBodyElem.style.transition = 'none'
			this.noteShowHidden()
		}.bind(this), 500);
	}

	/**
	 * 最大化播放器
	 */
	maximizePlayer(event) {
		this.setPlayerMode(this.player.mode === 'mini' ? 'normal' : 'mini')

		let apElem = document.querySelector('.aplayer-fixed')
		let apBodyElem = document.querySelector('.aplayer-body')

		apBodyElem.style.transition = 'all .5s ease'
		apElem.style.background = '#fff'

		if (this.nowStop.left + '' === '0' && this.nowStop.bottom + '' === '0') {
			apElem.style.left = apBodyElem.style.left = this.lastStop.left + 'px'
			apElem.style.bottom = apBodyElem.style.bottom = this.lastStop.bottom + 'px'
			this.nowStop = { ...this.lastStop }
		}

		setTimeout(function () {
			apBodyElem.style.transition = 'none'
			this.noteShowHidden()
			this.playerStop(event)
		}.bind(this), 500);
	}

	/**
	 * 初始化音符
	 */
	initNote() {
		let note = document.createElement('div')
		note.className = 'note-container'
		this.player.container.parentNode.appendChild(note)
		// 判断是左还是右
		let animationNamePrefix = this.nowStop.left > (document.body.clientWidth >> 1)
			? 'note-move-right' : 'note-move-left'
		// 初始化每个音符
		for (let i = 1; i < 4; i++) {
			let elem = document.createElement('div')
			elem.id = 'note' + i
			elem.className = 'note'
			elem.innerHTML = '<svg class="icon" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="32" height="32"><path d="M1023.962 64.037c0-43.42-42.2-74.019-83.199-61.019L300.795 192.015c-26.6 8.4-44.8 33-44.8 60.999v522.83c-20.1-4.76-41.439-7.84-63.998-7.84C85.958 768.005 0 825.305 0 896.003S85.958 1024 191.997 1024s191.996-57.299 191.996-127.998V428.631l511.991-150.038v369.254c-20.1-4.76-41.44-7.84-63.999-7.84-106.038 0-191.996 57.299-191.996 127.998s85.958 127.997 191.996 127.997 191.997-57.299 191.997-127.997l-.02-703.968z"/></svg>'
			elem.querySelector('svg path').style.fill = this.randomRGBColor()
			elem.style.animationName = animationNamePrefix + i
			note.appendChild(elem)
		}
		// 添加到播放封面里
		document.querySelector('.aplayer-pic').appendChild(note)
	}

	/**
	 * 音符显示或隐藏，或改变方向
	 */
	noteShowHidden() {
		let noteContainerElem = document.querySelector('.note-container')
		if (noteContainerElem) {
			// 是否显示音符
			noteContainerElem.className = this.player.audio.paused
				? 'note-container'
				: 'note-container playing'
			// 左右音符切换
			let animationNamePrefix = this.nowStop.left > (document.body.clientWidth >> 1)
				? 'note-move-right' : 'note-move-left'
			for (let i = 1; i < 4; i++) {
				let noteElem = document.getElementById('note' + i)
				noteElem.style.animationName = animationNamePrefix + i
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

	/**
	 * 设置播放器模式
	 */
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
}

