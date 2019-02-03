import Animation from '../base/animation'
import DataBus from '../databus'

// const ENEMY_IMG_SRC = 'images/enemy.png'

const ENEMY_WIDTH = 60
const ENEMY_HEIGHT = 60

const screenWidth = window.innerWidth
const screenHeight = window.innerHeight
const PLAYER_WIDTH = 25 * 2
const PLAYER_HEIGHT = 63 * 2

const __ = {
  speed: Symbol('speed'),
  move: Symbol('move')
}
const garbages = {
  dry: 'dry_garbage',
  recyclable: 'recyclable_trash',
  wet: 'wet_garbage',
  harmful: 'harmful_garbage'
}

let databus = new DataBus()

function rnd(start, end) {
  return Math.floor(Math.random() * (end - start) + start)
}

export default class Enemy extends Animation {
  constructor() {
    
    let CLASSIFICATION = Math.floor(Math.random() * 4) + 1
    let classification = CLASSIFICATION
    let NUMBER = Math.floor(Math.random() * 5) + 1
    let GARBAGE_NUMBER = ''
    switch (classification) {
      case 1:
        GARBAGE_NUMBER = garbages.dry
        break
      case 2:
        GARBAGE_NUMBER = garbages.recyclable
        break
      case 3:
        GARBAGE_NUMBER = garbages.wet
        break
      case 4:
        GARBAGE_NUMBER = garbages.harmful
        break
    }

    let ENEMY_IMG_SRC = 'images/garbages/' + GARBAGE_NUMBER + '/' + NUMBER + '.png'
    super(ENEMY_IMG_SRC, ENEMY_WIDTH, ENEMY_HEIGHT)
    this.classification = classification
    //this.initExplosionAnimation()
  }

  init(speed) {
    this.color_bright = 0
    this.x = rnd(0, window.innerWidth - ENEMY_WIDTH)
    this.y = -this.height
    this[__.speed] = speed
    this[__.move] = 0
    this.isLiving = 0
    this.visible = true
    let CLASSIFICATION = Math.floor(Math.random() * 4) + 1
    let classification = CLASSIFICATION
    let NUMBER = Math.floor(Math.random() * 5) + 1
    let GARBAGE_NUMBER = ''
    switch (classification) {
      case 1:
        GARBAGE_NUMBER = garbages.dry
        break
      case 2:
        GARBAGE_NUMBER = garbages.recyclable
        break
      case 3:
        GARBAGE_NUMBER = garbages.wet
        break
      case 4:
        GARBAGE_NUMBER = garbages.harmful
        break
    }

    this.img.src = 'images/garbages/' + GARBAGE_NUMBER + '/' + NUMBER + '.png'
    this.classification = classification
    // console.log(this.classification)
  }

  // 预定义爆炸的帧动画
  initExplosionAnimation() {
    let frames = []

    const EXPLO_IMG_PREFIX = 'images/explosion'
    const EXPLO_FRAME_COUNT = 19

    for (let i = 0; i < EXPLO_FRAME_COUNT; i++) {
      frames.push(EXPLO_IMG_PREFIX + (i + 1) + '.png')
    }

    this.initFrames(frames)
  }

  // 每一帧更新子弹位置
  update() {
    this.y += this[__.speed]

    this.x += this[__.move]

    // 对象回收
    if (this.y > (window.innerHeight - PLAYER_HEIGHT / 2 - 30)) {
      if (this.isLiving == 0){
        this.isLiving = -1
        
      }
        
      databus.updateColor=1
      databus.removeEnemey(this)
    }

  }
  comeout(x, y, classifition) {
    this.isLiving = 1
    let center_x = 0
    let center_y = (screenHeight - PLAYER_HEIGHT / 2 - 30)
    if (classifition == 1) {
      center_x = (screenWidth / 8 - ENEMY_WIDTH / 2)
    } else if (classifition == 2) {
      center_x = (screenWidth * 3 / 8 - ENEMY_WIDTH / 2)
    } else if (classifition == 3) {
      center_x = (screenWidth * 5 / 8 - ENEMY_WIDTH / 2)
    } else if (classifition == 4) {
      center_x = (screenWidth * 7 / 8 - ENEMY_WIDTH / 2)
    }
    console.log('center-x:' + center_x + 'center-y:' + center_y)

    let error_x = center_x - x
    let error_y = center_y - y
    let ratio = error_y / this[__.speed]
    this[__.speed] = this[__.speed] * 5
    this[__.move] = error_x / ratio * 5

  }
}