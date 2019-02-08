import Player from './player/index'
import Enemy from './npc/enemy'
import BackGround from './runtime/background'
import GameInfo from './runtime/gameinfo'
import Music from './runtime/music'
import DataBus from './databus'
import Ashcan from './player/ashcan'
import HOME from './home/home'
let ctx = canvas.getContext('2d')
let databus = new DataBus()

wx.cloud.init()
const db = wx.cloud.database()

/**
 * 游戏主函数
 */
export default class Main {
  constructor() {
    // 维护当前requestAnimationFrame的id
    this.aniId = 0
    this.personalHighScore = null

    // 0 present the normal and 1 present the difficult
    this.gameMode = 0

    // create the initial page and response the touch
    this.home()
    this.login()
  }

  login() {
    // 获取 openid
    wx.cloud.callFunction({
      name: 'login',
      success: res => {
        window.openid = res.result.openid
        this.prefetchHighScore()
      },
      fail: err => {
        console.error('get openid failed with error', err)
      }
    })
  }

  prefetchHighScore() {
    // 预取历史最高分
    db.collection('score').doc(`${window.openid}-score`).get()
      .then(res => {
        if (this.personalHighScore) {
          if (res.data.max > this.personalHighScore) {
            this.personalHighScore = res.data.max
          }
        } else {
          this.personalHighScore = res.data.max
        }
      })
      .catch(err => {
        console.error('db get score catch error', err)
        this.prefetchHighScoreFailed = true
      })
  }

  /**
   * clear the initial page and start the game loop
   */
  restart() {
    databus.reset()

    canvas.removeEventListener(
      'touchstart',
      this.touchHandler
    )
    this.hasEventBind = true
    this.touchHandler = this.touchEventHandler.bind(this)
    canvas.addEventListener('touchstart', this.touchHandler)

    this.bg = new BackGround(ctx)
    this.player = new Ashcan(ctx, this.gameMode)
    this.gameinfo = new GameInfo()
    this.music = new Music()

    this.bindLoop = this.loop.bind(this)
    this.hasEventBind = false

    // 清除上一局的动画
    window.cancelAnimationFrame(this.aniId);

    this.aniId = window.requestAnimationFrame(
      this.bindLoop,
      canvas
    )
  }

  /**
   * 随着帧数变化的敌机生成逻辑
   * 帧数取模定义成生成的频率
   */
  enemyGenerate() {
    if (databus.frame % 100 === 0) {
      let enemy = databus.pool.getItemByClass('enemy', Enemy)
      // enemy.init(6)
      enemy.init(2, Math.floor(Math.random() * 4) + 1)
      databus.enemys.push(enemy)
    }
  }


  // 全局碰撞检测
  // collisionDetection() {
  //   let that = this

  //   databus.bullets.forEach((bullet) => {
  //     for ( let i = 0, il = databus.enemys.length; i < il;i++ ) {
  //       let enemy = databus.enemys[i]

  //       if ( !enemy.isPlaying && enemy.isCollideWith(bullet) ) {
  //         enemy.playAnimation()
  //         that.music.playExplosion()

  //         bullet.visible = false
  //         databus.score  += 1

  //         break
  //       }
  //     }
  //   })

  //   for ( let i = 0, il = databus.enemys.length; i < il;i++ ) {
  //     let enemy = databus.enemys[i]

  //     if ( this.player.isCollideWith(enemy) ) {
  //       databus.gameOver = true

  //       // 获取历史高分
  //       if (this.personalHighScore) {
  //         if (databus.score > this.personalHighScore) {
  //           this.personalHighScore = databus.score
  //         }
  //       }

  //       // 上传结果
  //       // 调用 uploadScore 云函数
  //       wx.cloud.callFunction({
  //         name: 'uploadScore',
  //         // data 字段的值为传入云函数的第一个参数 event
  //         data: {
  //           score: databus.score
  //         },
  //         success: res => {
  //           if (this.prefetchHighScoreFailed) {
  //             this.prefetchHighScore()
  //           }
  //         },
  //         fail: err => {
  //           console.error('upload score failed', err)
  //         }
  //       })

  //       break
  //     }
  //   }
  // }

  collisionDetection() {
    let that = this

    databus.bullets.forEach((bullet) => {
      for (let i = 0, il = databus.enemys.length; i < il; i++) {
        let enemy = databus.enemys[i]

        if (!enemy.isPlaying && enemy.isCollideWith(bullet)) {
          enemy.playAnimation()
          that.music.playExplosion()

          bullet.visible = false
          databus.score += 1

          break
        }
      }
    })

    for (let i = 0, il = databus.enemys.length; i < il; i++) {
      let enemy = databus.enemys[i]

      if (this.player.isCollideWith(enemy)) {
        databus.gameOver = true

        // 获取历史高分
        if (this.personalHighScore) {
          if (databus.score > this.personalHighScore) {
            this.personalHighScore = databus.score
          }
        }

        // 上传结果
        // 调用 uploadScore 云函数
        wx.cloud.callFunction({
          name: 'uploadScore',
          // data 字段的值为传入云函数的第一个参数 event
          data: {
            score: databus.score
          },
          success: res => {
            if (this.prefetchHighScoreFailed) {
              this.prefetchHighScore()
            }
          },
          fail: err => {
            console.error('upload score failed', err)
          }
        })

        break
      }
    }
  }

  // 游戏结束后的触摸事件处理逻辑
  // 这个是点击垃圾桶的处理逻辑吧？
  touchEventHandler(e) {
    e.preventDefault()

    let x = e.touches[0].clientX
    let y = e.touches[0].clientY
    let classification = this.player.whichIsTouched(x, y)

    let that = this


    //for (let i = 0, il = databus.enemys.length; i < il; i++) {
      // if (databus.enemys.length > 0) {

    if (databus.enemys.length == 0) {
      this.player.changeColor(0)
    } else {
      let enemy = databus.enemys[0]
      console.log('isLiving' + enemy.isLiving)
      if (enemy.isLiving != 1) {
        if (enemy.classification == classification) {
          enemy.comeout(enemy.x, enemy.y, enemy.classification)
          this.player.changeColor(databus.enemys[0].classification)
          databus.score += 1
          //break
        }
      }
    
    }  
      // }
    //}

    if (databus.gameOver) {
      let area = this.gameinfo.btnArea

      if (x >= area.startX &&
        x <= area.endX &&
        y >= area.startY &&
        y <= area.endY) {
        this.restart()
      }
    }

  }

  /**
   * canvas重绘函数
   * 每一帧重新绘制所有的需要展示的元素
   */
  render() {
    // clear the old canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    // render the scrolling background
    this.bg.render(ctx)
    // draw the enemies onto the canvas
    databus.enemys.forEach((item) => {
        item.drawToCanvas(ctx)
      })
    // draw the four ashcans onto the canvas
    this.player.drawToCanvas(ctx)
    // play the animations in the queue
    databus.animations.forEach((ani) => {
      if (ani.isPlaying) {
        ani.aniRender(ctx)
      }
    })

    this.gameinfo.renderGameScore(ctx, databus.score)

    this.gameinfo.renderGameLife(ctx,databus.life)

    // 游戏结束停止帧循环
    if (databus.gameOver) {
      this.gameinfo.renderGameOver(
        ctx,
        databus.score,
        this.personalHighScore
      )

      if (!this.hasEventBind) {
        this.hasEventBind = true
        this.touchHandler = this.touchEventHandler.bind(this)
        canvas.addEventListener('touchstart', this.touchHandler)
      }
    }
  }

  // 游戏逻辑更新主函数
  update() {
    if (databus.gameOver)
      return;

    // this.bg.update()

   databus.enemys.forEach((item) => {
        item.update()
        if (item.isLiving == -1) {

          if(databus.life==1){
            databus.life = databus.life - 1
            databus.gameOver = true
          }else{
            databus.life = databus.life - 1
          }
          
          return;
        }else{
          
        }
      })
    // console.log(databus.updateColor)
    if (databus.updateColor==1){
      this.player.changeColor(0)
      databus.updateColor=0
    }
    
    this.enemyGenerate()

    
    // this.collisionDetection()
    // this.touchEventHandler()

    // if (databus.frame % 20 === 0) {
    //   // this.player.shoot()
    //   this.music.playShoot()
    // }
  }

  // 实现游戏帧循环
  loop() {
    databus.frame++

    this.update()
    this.render()

    this.aniId = window.requestAnimationFrame(
      this.bindLoop,
      canvas
    )
  }

  /**
   * the touch handler for the three buttons on the initial page.
   * note that the restart function will remove the touch handler, 
   * so the function should return immediately after the touch response.
   * @param e the touch event
   */
  game_start(e) {
    e.preventDefault()

    let x = e.touches[0].clientX
    let y = e.touches[0].clientY

    area = this.bg.modeBtnArea

    if (x >= area.startX &&
      x <= area.endX &&
      y >= area.startY &&
      y <= area.endY) {
      this.changeMode()
      return;
    }

    area = this.bg.rankBtnArea

    if (x >= area.startX &&
      x <= area.endX &&
      y >= area.startY &&
      y <= area.endY) {
      console.log('rank!')
      return;
    }

    let area = this.bg.startBtnArea

    if (x >= area.startX &&
      x <= area.endX &&
      y >= area.startY &&
      y <= area.endY) {
      this.restart()
      return;
    }

  }

  /**
   * change the mode of the game, together the icon of the mode button
   */
  changeMode() {
    this.gameMode = (this.gameMode + 1) % 2
    this.bg.changeModeIcon()
  }


  home() {
    canvas.removeEventListener(
      'touchstart',
      this.touchHandler
    )
    this.hasEventBind = true
    this.touchHandler = this.game_start.bind(this)
    canvas.addEventListener('touchstart', this.touchHandler)
    this.bg = new HOME(ctx)
    this.bindLoop = this.home_loop.bind(this)
    this.hasEventBind = false

    // 清除上一局的动画
    window.cancelAnimationFrame(this.aniId);

    this.aniId = window.requestAnimationFrame(
      this.bindLoop,
      canvas
    )

  }
  home_render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    this.bg.render(ctx)
  }
  home_loop() {
    this.home_render()
    this.aniId = window.requestAnimationFrame(
      this.bindLoop,
      canvas
    )
  }

}