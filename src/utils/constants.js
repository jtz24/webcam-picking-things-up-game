// 颜色常量 (从 color.py 转换)
export const COLORS = {
        WHITE: '#FFFFFF',
        BLACK: '#000000',
        RED: '#FF0000',
        GREEN: '#00FF00',
        BLUE: '#0000FF',
        YELLOW: '#FFFF00',
        CYAN: '#00FFFF',
        MAGENTA: '#FF00FF',
        SILVER: '#C0C0C0',
        GRAY: '#808080',
        DARKGRAY: '#646464',
        DARKRED: '#8B0000',
        DARK_GREEN: '#006400',
        OLIVE_GREEN: '#228B22'
    }
    
    // 资源路径
    export const ASSETS = {
        IMAGES: {
            BLACK: new URL('../assets/images/black.png', import.meta.url).href,
            GREEN: new URL('../assets/images/green.png', import.meta.url).href,
            RED: new URL('../assets/images/red.png', import.meta.url).href,
            AVATARL: new URL('../assets/images/avatarL.png', import.meta.url).href,
            AVATARR: new URL('../assets/images/avatarR.png', import.meta.url).href,
            AVATARL_GRASP: new URL('../assets/images/avatarLG.png', import.meta.url).href,
            AVATARR_GRASP: new URL('../assets/images/avatarRG.png', import.meta.url).href,
            BACKGROUND: new URL('../assets/images/stationery_bg.png', import.meta.url).href,
            BONUS_1: new URL('../assets/images/stationery_1.png', import.meta.url).href,
            BONUS_2: new URL('../assets/images/stationery_2.png', import.meta.url).href,
            BONUS_3: new URL('../assets/images/stationery_3.png', import.meta.url).href,
            BONUS_4: new URL('../assets/images/stationery_4.png', import.meta.url).href,
            BONUS_5: new URL('../assets/images/stationery_5.png', import.meta.url).href,
            BONUS_6: new URL('../assets/images/stationery_6.png', import.meta.url).href,
            BOX: new URL('../assets/images/box.png', import.meta.url).href
        },
        SOUNDS: {
            BACKGROUND_MUSIC: new URL('../assets/sounds/backgroundmusic.mp3', import.meta.url).href,
            BAD: new URL('../assets/sounds/collision.wav', import.meta.url).href,
            GOOD: new URL('../assets/sounds/coin.mp3', import.meta.url).href,
            FIRST_PICK_UP_EN: new URL('../assets/sounds/silence.mp3', import.meta.url).href,
            FIRST_WRONG_BIN_EN: new URL('../assets/sounds/silence.mp3', import.meta.url).href,
            FIRST_JUNK_WRONG_BIN_EN: new URL('../assets/sounds/silence.mp3', import.meta.url).href,
            FIRST_PICK_UP_ZH: new URL('../assets/sounds/silence.mp3', import.meta.url).href,
            FIRST_WRONG_BIN_ZH: new URL('../assets/sounds/silence.mp3', import.meta.url).href,
            FIRST_JUNK_WRONG_BIN_ZH: new URL('../assets/sounds/silence.mp3', import.meta.url).href,
            SILENCE: new URL('../assets/sounds/silence.mp3', import.meta.url).href
        }
    }

    // 游戏配置 (从 initialization.py 转换)
    export const GAME_CONFIG = {
        SCREEN_WIDTH: 1920,
        SCREEN_HEIGHT: 1080,
        GAME_DURATION: 120,
        INITIAL_LIFE: 3,
        MAX_SCORE: 360,
        CALIBRATION_MIN_X: 800,
        CALIBRATION_MAX_X: 1120,
        CALIBRATION_MIN_WIDTH: 200,
        CALIBRATION_MAX_WIDTH: 450,
        NO_OF_ITEM_TYPES: 3
    }

    export const ITEMS_LIST = [
        {
            img: 'BONUS_1',
            width: 58,
            height: 81
        },{
            img: 'BONUS_2',
            width: 59,
            height: 94
        },{
            img: 'BONUS_3',
            width: 84,
            height: 141
        },{
            img: 'BONUS_4',
            width: 76,
            height: 135
        },{
            img: 'BONUS_5',
            width: 83,
            height: 128
        },{
            img: 'BONUS_6',
            width: 75,
            height: 75
        },
    ]
    
    // 难度设置
    export const DIFFICULTY_SETTINGS = {
        EASY: {
            GAME_DURATION: 60,
            NO_OF_ITEMS: 6,
            NO_OF_JUNK: 3,
            HOLD_TIME: 1000
        },
        MEDIUM: {
            GAME_DURATION: 60,
            NO_OF_ITEMS: 12,
            NO_OF_JUNK: 5,
            HOLD_TIME: 1500
        },
        HARD: {
            GAME_DURATION: 60,
            NO_OF_ITEMS: 18,
            NO_OF_JUNK: 8,
            HOLD_TIME: 2000
        }
    }