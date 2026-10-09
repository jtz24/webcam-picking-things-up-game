<template>
    <div class="game-canvas">
        <canvas ref="canvas"></canvas>
        <!-- 游戏内容 -->
        <template v-if="gameState == 'playing'">
            <GameObject 
                :gameObjects="gameObjects"
                :assets="gameAssets"
            />
            <div class="score-display">
                <div class="score"> {{ t('score') }}: {{ score }}</div>
                <div class="time" :class="{ 'time-warning': gameTime <= 30 }">
                    {{ t('countTime') }}: {{ gameTime }}s
                </div>
            </div>
        </template>
        <!-- 游戏结束画面 -->
        <div class="game-over" v-if="gameState == 'gameover'">
            <div class="game-over-content">
                <h1>Game Over</h1>
                <div class="stats">
                    <p>{{ t('timePlayed') }}: {{ DIFFICULTY_CONFIG.GAME_DURATION - gameTime }}</p>
                    <p>{{ t('finalScore') }}: {{ score }}</p>
                </div>
                <div class="buttons">
                    <button @click="$emit('restart-game')">{{ t('retry')}}</button>
                    <button @click="backToMenu">{{ t('back')}}</button>
                </div>
            </div>
        </div>
        <!-- 添加分数动画 -->
        <div class="score-animations">
            <transition-group name="score-popup">
                <div 
                    v-for="animation in scoreAnimations" 
                    :key="animation.id"
                    class="score-popup"
                    :style="{ 
                        left: `${animation.x}px`, 
                        top: `${animation.y}px`,
                        color: animation.value > 0 ? '#4CAF50' : '#FF0000'
                    }"
                >
                    {{ animation.value > 0 ? '+' : '' }}{{ animation.value }}
                </div>
            </transition-group>
        </div>
    </div>
</template>
<script setup>
import { t } from '../Language/language.js'
import { ref, onMounted, onUnmounted, computed } from 'vue'
import GameObject from './GameObject.vue'
import { GAME_CONFIG as GC, DIFFICULTY_SETTINGS, ITEMS_LIST } from '../utils/constants'
const emit = defineEmits(['restart-game', 'back-to-menu'])
// 游戏状态
const canvas = ref(null)
const gameAssets = ref(null)
const gameObjects = ref({})
const gameState = ref("menu") //menu,countdown,calibrating,playing,gameover
const score = ref(0)
const playerInfo = ref({})
const tutorialPlayed = ref({'FIRST_PICK_UP': false, 'FIRST_WRONG_BIN': false, 'FIRST_JUNK_WRONG_BIN': false, lastAudio: ''})
const isPlayingTutorial = ()=>{
    return tutorialPlayed.value.lastAudio != '' && (gameAssets.value.sounds[t(tutorialPlayed.value.lastAudio)].currentTime < (gameAssets.value.sounds[t(tutorialPlayed.value.lastAudio)].duration-0.01))
}
const input = ref({})
const theme = ref({items:[], junk:[]})
let gameLoop = null
const gameStartTime = ref(0)
const gameTime = ref(0)
let lastUpdateTime = null
let gameTimer = null
// 添加难度属性
const difficulty = ref('medium') // 默认难度
const mode = ref('double')
let DIFFICULTY_CONFIG = DIFFICULTY_SETTINGS.MEDIUM
// 添加分数动画数组
const scoreAnimations = ref([])
let animationId = 0
// 添加背景音乐状态
let backgroundMusic = null
// 初始化游戏
const initGame = () => {
    // 绘制背景
    if (canvas.value && gameAssets.value) {
        const ctx = canvas.value.getContext('2d')
        ctx.drawImage(
            gameAssets.value.images.BACKGROUND,
            0,
            0,
            canvas.value.width,
            canvas.value.height
        )
    }
    gameState.value = "playing"
    gameStartTime.value = Date.now()
    
    // 根据难度设置游戏时间
    gameTime.value = DIFFICULTY_CONFIG.GAME_DURATION

    // 修改计时器，现在是倒计时
    gameTimer = setInterval(() => {
        if (gameTime.value > 0) {
            gameTime.value--
            // 当时间到达0时结束游戏
            if (gameTime.value <= 0) {
                gameOver()
            }
        }
    }, 1000)

    const permutation = generateRandomPermutation(ITEMS_LIST.length)
    for (let i = 0; i < GC.NO_OF_ITEM_TYPES; i++){
        theme.value.items.push(ITEMS_LIST[permutation[i]-1])
    }
    for (let i = GC.NO_OF_ITEM_TYPES; i < ITEMS_LIST.length; i++){
        theme.value.junk.push(ITEMS_LIST[permutation[i]-1])
    }
    
    // 播放背景音乐
    if (gameAssets.value?.sounds?.BACKGROUND_MUSIC) {
        backgroundMusic = gameAssets.value.sounds.BACKGROUND_MUSIC
        backgroundMusic.loop = true
        backgroundMusic.volume = 0.5
        backgroundMusic.play()
    }
    spawnBins()
    spawnItems()
    startGameLoop()
}
// 修改生成奖励物品的函数
const spawnItems = () => {
    for (let i=0; i < 3; i++){
        for (let j=0; j < 2; j++){
            for (let k=0; k < DIFFICULTY_CONFIG.NO_OF_ITEMS / 6; k++){
                const type = randint(0, theme.value.items.length - 1)
                const bonusX = randint(300 + i * (GC.SCREEN_WIDTH - 600) / 3, 
                    300 + (i + 1) * (GC.SCREEN_WIDTH - 600) / 3) - theme.value.items[type].width / 2
                const bonusY = randint(50 + j * (GC.SCREEN_HEIGHT - 400) / 2, 
                    50 + (j + 1) * (GC.SCREEN_HEIGHT - 400) / 2) - theme.value.items[type].height / 2
                gameObjects.value.items.push({
                    type: type,
                    x: bonusX,
                    y: bonusY,
                    yv: 0,
                    width: theme.value.items[type].width,
                    height: theme.value.items[type].height,
                    held: false,
                    touchTime: -1,
                    hand: 'L',
                    image: theme.value.items[type].img,
                    points: GC.MAX_SCORE / DIFFICULTY_CONFIG.NO_OF_ITEMS,
                    frames: 1
                })
            }
        }
    }
    for (let i=0; i < DIFFICULTY_CONFIG.NO_OF_JUNK; i++){
        const type = randint(0, theme.value.junk.length - 1)
        const bonusX = randint(300, GC.SCREEN_WIDTH - 300 - theme.value.junk[type].width)
        const bonusY = randint(50, GC.SCREEN_HEIGHT - 350 - theme.value.junk[type].height)
        gameObjects.value.items.push({
            type: theme.value.items.length,
            x: bonusX,
            y: bonusY,
            yv: 0,
            width: theme.value.junk[type].width,
            height: theme.value.junk[type].height,
            held: false,
            touchTime: -1,
            hand: 'L',
            image: theme.value.junk[type].img,
            points: 0,
            frames: 1
        })
    }
}
const spawnBins = () => {
    const binWidth = 250
    const binHeight = 200
    const binGap = 50
    for (let i=0; i < theme.value.items.length; i++){
        gameObjects.value.bins.push({
            type: i,
            x: GC.SCREEN_WIDTH / 2 + (binWidth + binGap) * (i - theme.value.items.length / 2) + binGap / 2,
            y: GC.SCREEN_HEIGHT - binGap - binHeight,
            width: binWidth,
            height: binHeight,
            image: `BOX`,
            frames: 1
        })
        gameObjects.value.bins.push({
            type: i,
            x: GC.SCREEN_WIDTH / 2 + (binWidth + binGap) * (i - theme.value.items.length / 2 + 1 / 2) - theme.value.items[i].width / 2,
            y: GC.SCREEN_HEIGHT - binGap - binHeight / 2 - theme.value.items[i].height / 2,
            width: theme.value.items[i].width,
            height: theme.value.items[i].height,
            image: theme.value.items[i].img,
            frames: 1
        })
    }
}
// 游戏主循环
const startGameLoop = () => {
    lastUpdateTime = Date.now()
    const loop = () => {
        try {
            if (gameState.value != "playing") return
            updateGame()
            gameLoop = requestAnimationFrame(loop)
            lastUpdateTime = Date.now()
        } catch (error) {
            console.error('Error in game loop:', error)
            // 如果发生错误，尝试重新启动游戏循环
            gameLoop = requestAnimationFrame(loop)
            lastUpdateTime = Date.now()
        }
    }
    gameLoop = requestAnimationFrame(loop)
}
// 更新游戏状态
const updateGame = () => {
    const currentTime = Date.now()
    gameObjects.value.players[0].x = input.value.handLX
    gameObjects.value.players[0].y = input.value.handLY
    gameObjects.value.players[1].x = input.value.handRX
    gameObjects.value.players[1].y = input.value.handRY
    if (mode.value == 'grasp'){
        gameObjects.value.players[0].grasping = input.value.graspL
        gameObjects.value.players[0].image = input.value.graspL ? `AVATARL_GRASP` : `AVATARL`
        gameObjects.value.players[1].grasping = input.value.graspR
        gameObjects.value.players[1].image = input.value.graspR ? `AVATARR_GRASP` : `AVATARR`
    }
    gameObjects.value.items = gameObjects.value.items.filter(item => {
        if (item.held) {
            if (mode.value == 'single'){
                item.x = gameObjects.value.players[item.hand].x + gameObjects.value.players[item.hand].width / 2 - item.width / 2
                item.y = gameObjects.value.players[item.hand].y + gameObjects.value.players[item.hand].height / 2 - item.height / 2
                for (let i=0; i < theme.value.items.length * 2; i++){
                    if (checkCollision(gameObjects.value.bins[i], item)){
                        if (gameObjects.value.bins[i].type == item.type){
                            addScore(item.x, item.y, item.points)
                            gameObjects.value.players[item.hand].holding = false
                            return false
                        }else{
                            item.touchTime = -1
                            item.held = false
                            gameObjects.value.players[item.hand].holding = false
                            item.yv = randint(150,250)
                        }
                    }
                }
            }else if (mode.value == 'double'){
                item.x = (input.value.handLX + input.value.handRX) / 2 + gameObjects.value.players[0].width / 2 - item.width / 2
                item.y = (input.value.handLY + input.value.handRY) / 2 + gameObjects.value.players[0].height / 2 - item.height / 2
                if (!(checkCollision(gameObjects.value.players[0], item) && checkCollision(gameObjects.value.players[1], item))) {
                    item.held = false
                    gameObjects.value.players[0].holding = false
                    for (let i=0; i < theme.value.items.length * 2; i++){
                        if (checkCollision(gameObjects.value.bins[i], item)){
                            if (gameObjects.value.bins[i].type == item.type){
                                addScore(item.x, item.y, item.points)
                                return false
                            }else{
                                item.yv = randint(50,200)
                            }
                        }
                    }
                }
            }else if (mode.value == 'grasp'){
                item.x = gameObjects.value.players[item.hand].x + gameObjects.value.players[item.hand].width / 2 - item.width / 2
                item.y = gameObjects.value.players[item.hand].y + gameObjects.value.players[item.hand].height / 2 - item.height / 2
                if (!gameObjects.value.players[item.hand].grasping) {
                    item.held = false
                    gameObjects.value.players[item.hand].holding = false
                    for (let i=0; i < theme.value.items.length * 2; i++){
                        if (checkCollision(gameObjects.value.bins[i], item)){
                            if (gameObjects.value.bins[i].type == item.type){
                                addScore(item.x, item.y, item.points)
                                return false
                            }else{
                                item.yv = randint(50,200)
                            }
                        }
                    }
                }
            }
            if (item.yv != 0){
                gameAssets.value.sounds.BAD.play()
                if (item.type == theme.value.items.length && !tutorialPlayed.value.FIRST_JUNK_WRONG_BIN && !isPlayingTutorial()){
                    gameAssets.value.sounds[t('FIRST_JUNK_WRONG_BIN')].play()
                    tutorialPlayed.value.FIRST_JUNK_WRONG_BIN = true
                    tutorialPlayed.value.lastAudio = 'FIRST_JUNK_WRONG_BIN'
                }else if (item.type != theme.value.items.length && !tutorialPlayed.value.FIRST_WRONG_BIN && !isPlayingTutorial()){
                    gameAssets.value.sounds[t('FIRST_WRONG_BIN')].play()
                    tutorialPlayed.value.FIRST_WRONG_BIN = true
                    tutorialPlayed.value.lastAudio = 'FIRST_WRONG_BIN'
                }
            }
        }else{
            if (mode.value == 'single'){
                const touchL = checkCollision(gameObjects.value.players[0], item) && !gameObjects.value.players[0].holding
                const touchR = checkCollision(gameObjects.value.players[1], item) && !gameObjects.value.players[1].holding
                if (item.touchTime == -1){
                    if (touchL || touchR){
                        if (!tutorialPlayed.value.FIRST_PICK_UP && !isPlayingTutorial()){
                            gameAssets.value.sounds[t('FIRST_PICK_UP')].play()
                            tutorialPlayed.value.FIRST_PICK_UP = true
                            tutorialPlayed.value.lastAudio = 'FIRST_PICK_UP'
                        }
                        if (touchL){
                            gameObjects.value.players[0].holding = true
                            item.hand = 0
                        }else{
                            gameObjects.value.players[1].holding = true
                            item.hand = 1
                        }
                        item.touchTime = Date.now()
                        gameObjects.value.bars.push({
                            x: item.x + item.width / 2 - 50,
                            y: item.y < 60 ? item.y + item.height + 20 : item.y - 40,
                            width: 100,
                            height: 20,
                            image: `BLACK`,
                            touchTime: Date.now(),
                            hand: item.hand,
                            itemHB: {x: item.x, y: item.y, width: item.width, height:item.height},
                            frames: 1
                        })
                        gameObjects.value.bars.push({
                            x: item.x + item.width / 2 - 48,
                            y: item.y < 60 ? item.y + item.height + 22 : item.y - 38,
                            width: 0,
                            height: 16,
                            image: `GREEN`,
                            touchTime: Date.now(),
                            hand: item.hand,
                            itemHB: {x: item.x, y: item.y, width: item.width, height:item.height},
                            frames: 1
                        })
                    }
                }else{
                    if (Date.now() - item.touchTime > DIFFICULTY_CONFIG.HOLD_TIME){
                        item.held = true
                        item.yv = 0
                    }else if (!checkCollision(gameObjects.value.players[item.hand], item)){
                        item.touchTime = -1
                        gameObjects.value.players[item.hand].holding = false
                    }
                }
            }else if (mode.value == 'double'){
                if (!gameObjects.value.players[0].holding && checkCollision(gameObjects.value.players[0], item) && checkCollision(gameObjects.value.players[1], item)) {
                    item.held = true
                    item.yv = 0
                    gameObjects.value.players[0].holding = true
                }
            }else if (mode.value == 'grasp'){
                if (checkCollision(gameObjects.value.players[0], item) && !gameObjects.value.players[0].holding && gameObjects.value.players[0].grasping){
                    item.held = true
                    item.hand = 0
                    item.yv = 0
                    gameObjects.value.players[0].holding = true
                }
                if (checkCollision(gameObjects.value.players[1], item) && !gameObjects.value.players[1].holding && gameObjects.value.players[1].grasping){
                    item.held = true
                    item.hand = 1
                    item.yv = 0
                    gameObjects.value.players[1].holding = true
                }
            }
        }
        item.yv *= 0.7
        item.y -= item.yv
        item.yv = item.yv < 0.05 ? 0 : item.yv
        return true
    })

    gameObjects.value.bars = gameObjects.value.bars.filter(bar => {
        if (checkCollision(gameObjects.value.players[bar.hand], bar.itemHB)){
            if (Date.now() - bar.touchTime > DIFFICULTY_CONFIG.HOLD_TIME){
                return false
            }
            if (bar.image == `GREEN`){
                bar.width = 96 * (Date.now() - bar.touchTime) / DIFFICULTY_CONFIG.HOLD_TIME
            }
            return true
        }else{
            return false
        }
    })
}
const randint = (a, b, excl = false) => {
    return Math.floor(a + (b - a + (excl?0:1)) * Math.random())
}
// 碰撞检测辅助函数
const checkCollision = (rect1, rect2) => {
    return rect1.x < rect2.x + rect2.width &&
                 rect1.x + rect1.width > rect2.x &&
                 rect1.y < rect2.y + rect2.height &&
                 rect1.y + rect1.height > rect2.y
}
// 添加分数增加函数
const addScore = (x, y, n) => {
    score.value += n
    // 显示得分动画
    showScoreAnimation(x, y, + n)
    // 播放得分音效
    gameAssets.value.sounds.GOOD.play()
    if (score.value == GC.MAX_SCORE){
        gameOver()
    }
}
// 游戏结束
const gameOver = () => {
    gameState.value = "gameover"
    // 停止游戏循环和计时器
    if (gameLoop) {
        cancelAnimationFrame(gameLoop)
    }
    if (gameTimer) {
        clearInterval(gameTimer)
    }
}
// 返回菜单
const backToMenu = () => {
    // 重置所有游戏状态
    resetGame()
    // 重置难度
    difficulty.value = 'medium'
    // 发送返回菜单事件
    emit('back-to-menu')
}
// 组件卸载时清理
onUnmounted(() => {
    if (gameTimer) {
        clearInterval(gameTimer)
    }
    // 停止并清理背景音乐
    if (backgroundMusic) {
        backgroundMusic.pause()
        backgroundMusic = null
    }
})
// 设置游戏资源
const setGameAssets = (assets, gameConfig) => {
    gameAssets.value = assets
    difficulty.value = gameConfig.difficulty
    mode.value = gameConfig.mode
    DIFFICULTY_CONFIG = DIFFICULTY_SETTINGS[difficulty.value.toUpperCase()]
}
// 重置游戏状态
const generateRandomPermutation = (n) => {
  let permutation = Array.from({ length: n }, (_, i) => i + 1)
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = permutation[j]
    permutation[j] = permutation[i]
    permutation[i] = temp
  }
  return permutation
}
const resetGame = () => {
    gameState.value = "menu"
    score.value = 0
    gameObjects.value = {
        bins:[],
        players:[{x: 0, y: 0, width:80, height:80, image:`AVATARL`, holding:false, grasping:false, frames:1},
            {x: 0, y: 0, width:80, height:80, image:`AVATARR`, holding:false, grasping:false, frames:1}],
        items:[],
        bars:[]
    }
    theme.value = {items:[],junk:[]}
    gameTime.value = DIFFICULTY_CONFIG.GAME_DURATION
    if (gameLoop) {
        cancelAnimationFrame(gameLoop)
    }
    if (gameTimer) {
        clearInterval(gameTimer)
    }
    // 停止背景音乐
    if (backgroundMusic) {
        backgroundMusic.pause()
        backgroundMusic.currentTime = 0
    }
}
// 更新角色位置（由姿势检测触发）
const setInput = (newInput) => {
    input.value=newInput
}
// 添加 onMounted 钩子来设画布尺寸
onMounted(() => {
    if (canvas.value) {
        if (window.innerWidth/window.innerHeight > GC.SCREEN_WIDTH/GC.SCREEN_HEIGHT){
            canvas.value.height = window.innerHeight
            canvas.value.width = GC.SCREEN_WIDTH * window.innerHeight / GC.SCREEN_HEIGHT
        }else{
            canvas.value.width = window.innerWidth
            canvas.value.height = GC.SCREEN_HEIGHT * window.innerWidth / GC.SCREEN_WIDTH
        }
        // 监听窗口大小变化
        window.addEventListener('resize', () => {
            if (window.innerWidth/window.innerHeight > GC.SCREEN_WIDTH/GC.SCREEN_HEIGHT){
                canvas.value.height = window.innerHeight
                canvas.value.width = GC.SCREEN_WIDTH * window.innerHeight / GC.SCREEN_HEIGHT
            }else{
                canvas.value.width = window.innerWidth
                canvas.value.height = GC.SCREEN_HEIGHT * window.innerWidth / GC.SCREEN_WIDTH
            }
            // 重新绘制背景
            if (gameAssets.value) {
                const ctx = canvas.value.getContext('2d')
                ctx.drawImage(
                    gameAssets.value.images.BACKGROUND,
                    0,
                    0,
                    canvas.value.width,
                    canvas.value.height
                )
            }
        })
    }
})
// 添加显示分数动画函数
const showScoreAnimation = (x, y, value) => {
    const animation = {
        id: animationId++,
        x,
        y,
        value
    }
    scoreAnimations.value.push(animation)
    setTimeout(() => {
        scoreAnimations.value = scoreAnimations.value.filter(a => a.id !== animation.id)
    }, 1000)
}
defineExpose({
    canvas,
    setGameAssets,
    setInput,
    backToMenu,
    resetGame,
    // startCalibration,
    initGame
})
</script>
<style scoped>
.game-canvas {
    margin: auto;
    z-index: 0;
    overflow: hidden;
}
canvas {
    margin: auto;
    overflow: hidden;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
}
.score-display {
    position: fixed;
    top: 20px;
    left: 20px;
    font-size: 48px;
    color: white;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
    z-index: 1000;
    background: rgba(0, 0, 0, 0.5);
    padding: 20px;
    border-radius: 10px;
    backdrop-filter: blur(5px);
}
.life {
    margin-bottom: 20px;
    color: #FF6B6B;
    font-weight: bold;
    text-shadow: 0 0 10px rgba(255, 107, 107, 0.5);
}
.score {
    color: #4CAF50;
    margin-bottom: 20px;
    font-weight: bold;
    text-shadow: 0 0 10px rgba(76, 175, 80, 0.5);
}
.collision-indicator {
    position: absolute;
    color: red;
    font-size: 32px;
    font-weight: bold;
    animation: fadeUp 1s ease-out;
    opacity: 0;
}
@keyframes fadeUp {
    0% {
        transform: translateY(0);
        opacity: 1;
    }
    100% {
        transform: translateY(-30px);
        opacity: 0;
    }
}
.game-over {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 100;
}
.game-over-content {
    background: rgba(143, 212, 245, 0.9);
    padding: 40px;
    border-radius: 20px;
    text-align: center;
    border: 2px solid rgba(255, 255, 255, 0.1);
}
.game-over h1 {
    color: #FF0000;
    font-size: 64px;
    font-weight: bold;
    margin-bottom: 30px;
    text-shadow: 0 0 10px rgba(255, 0, 0, 0.5);
}
.stats {
    margin-bottom: 30px;
}
.stats p {
    color: white;
    font-size: 48px;
    font-weight: bold;
    margin: 10px 0;
}
.buttons {
    display: flex;
    gap: 20px;
    justify-content: center;
}
.buttons button {
    padding: 15px 30px;
    font-size: 36px;
    font-weight: bold;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.3s ease;
}
.buttons button:first-child {
    background: #4CAF50;
    color: white;
}
.buttons button:last-child {
    background: #2196F3;
    color: white;
}
.buttons button:hover {
    transform: translateY(-2px);
    filter: brightness(1.1);
}
.time {
    color: #FFD700;
    font-weight: bold;
    text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
}
.time-warning {
    color: #FF0000 !important;
    animation: blink 1s infinite;
}
@keyframes blink {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
}
.progress-bar {
    height: 100%;
    background: #4CAF50;
    transition: width 0.1s linear;
}
.score-popup {
    position: fixed;
    left: 50% !important;    /* 强制居中 */
    top: 50% !important;     /* 强制居中 */
    transform: translate(-50%, -50%);
    font-size: 48px;    /* 增大字体 */
    font-weight: bold;
    pointer-events: none;
    animation: float-up 1s ease-out;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
    z-index: 1000;
}
.score-popup.positive {
    color: #4CAF50;
}
.score-popup.negative {
    color: #FF0000;
}
@keyframes float-up {
    0% {
        transform: translate(-50%, -50%) scale(1);
        opacity: 1;
    }
    100% {
        transform: translate(-50%, -100%) scale(1.5);
        opacity: 0;
    }
}
.score-popup-enter-active,
.score-popup-leave-active {
    transition: all 1s ease-out;
}
.score-popup-enter-from,
.score-popup-leave-to {
    opacity: 0;
    transform: translateY(20px);
}
</style>
