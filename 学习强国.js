// 作者: G大师
//能够完成文章阅读,视频观看,分享收藏频率以及本地频道使用,合计30分
auto()
requiresApi(24)
//requiresAutojsVersion('4.0.9')

var storage
var thread_main
var thread_main_monitor
var debugMode = false
var deviceUnlocker = require('解锁屏幕.js')
const IsRooted = files.exists("/sbin/su") || files.exists("/system/xbin/su") || files.exists("/system/bin/su")


initialize()

/*-----------------------------------------------------------------------------------*/
function main() {
    var initialMediaVolume = device.getMusicVolume()
    device.setMusicVolume(0)
    device.setBrightnessMode(0)
    device.setBrightness(0)
    device.keepScreenDim(100 * 60 * 1000)

    enterMainPage()

    readArticles()

    watchVideos()

    watchLocalChannel()

    device.setMusicVolume(initialMediaVolume)
    thread_main_monitor.interrupt()
    toastLog('学习强国打卡已结束')
    home()
    device.setBrightnessMode(1)
    device.cancelKeepingAwake()
}

function main_monitor() {
    for (var i = 0; i < 60 * 60; i++) {
        sleep(1000)
    }
    if (thread_main) {
        thread_main.interrupt()
        console.error('学习强国打卡超时')
        threads.start(function () {
            alert('错误', '学习强国打卡超时')
        })
    } else {
        log('thread_main_monitor timeout')
    }
}

function initialize() {

    if (device.getBattery() < 30 && !device.isCharging()) {
        threads.start(function () {
            alert('电量低', '电量低 学习强国脚本未执行')
        })
        exit()
    }
    
    if (device.isScreenOn()) {
        sleep(5000)
    }

    if (device.isScreenOn()) {
        var choiceMade
        var dialog_start = dialogs.build({
            title: '是否开始学习强国打卡?',
            positive: '确认',
            negative: '稍后提醒',
            checkBoxPrompt: '快速模式',
            checkBoxChecked: false
        }).on('any', (action, dialog) => {
            choiceMade = action
        }).on('check', (checked) => {
            // 监听勾选框   但无动作则不执行  即采用默认值
            if (checked)
                toast('快速模式预计十分钟,将无法获取时长分')
            else
                toast('完整模式预计花费一小时左右')

            debugMode = checked
        }).on("dismiss", (dialog) => {
            if (choiceMade != 'positive') {
                toastLog('脚本将在半小时后运行')
                sleep(30 * 60 * 1000)
                dialog_start.show()
            } else {
                thread_main = threads.start(main)
                thread_main_monitor = threads.start(main_monitor)
            }
        })

        dialog_start.show()
    } else {
        if (deviceUnlocker.unlockDevice()) {
            thread_main = threads.start(main)
            thread_main_monitor = threads.start(main_monitor)
        } else {
            threads.start(function () {
                alert('错误', '解锁屏幕失败')
            })
            log('解锁屏幕失败,脚本已结束')
            exit()
        }
    }
}

function enterMainPage() {

    launchApp('学习强国')
    toast('等待学习强国启动')
    sleep(5000)

    if (!isMainPage()) {
        sleep(5000)
    }

    //如果还未加载主界面 可能停留在内部页面 返回主界面
    for (var i = 0; i < 5; i++) {
        if (!isMainPage()) {
            back()
            sleep(1000)
        } else {
            break
        }
    }

    if (!isMainPage()) {  //如果加载失败
        console.error('主界面加载失败')
        threads.start(function () {
            alert('错误', '主界面加载失败,脚本未执行')
        })
        exit()
    }

    storage = storages.create('XueXiQiangGuoDataLog')

    if (storage.get('lastShareMarkCommentDate') != new Date().getDate()) {
        storage.put('lastShareMarkCommentDate', new Date().getDate())
        storage.put('shareMarkCommentRunTimes', 0)
    }

    //var score = id('comm_head_xuexi_score').findOne(1000).text()
    var totalScore = text('积分').findOne(1000).parent().child(1).text()
    if (storage.get('lastScoreUpdateDate') != new Date().getDate()) {
        storage.put('lastScoreUpdateDate', new Date().getDate())
        storage.put('lastTotalScore', totalScore - 1)//登陆自动给1分
    }
    toastLog('main page entered')
}

function readArticles() {
    if (!isMainPage()) {
        enterMainPage()
    }
    toastLog('article read begin')

    //id('home_bottom_tab_button_work').findOne(1000).click()
    smartClick(desc('学习').findOne(1000))
    sleep(1000)
    //id('home_bottom_tab_button_work').findOne(1000).click()
    smartClick(desc('学习').findOne(1000))
    sleep(3000)
    date_yesterday = getDay('Yesterday')

    for (var readCounts = 0, failedCounts = 0; readCounts < 8 && failedCounts < 100;) {
        var p = boundsInside(200, 300, device.width - 200, device.height - 200).text(date_yesterday).findOne(100)
        if (p) {
            smartClick(p)
            sleep(3000)
            if (desc('播放').exists()) {
                //如果是视频就跳过
                backToHomePage()
                continue
            } else {
                readCounts++
            }

            if (!debugMode) {
                for (var i = 0; i < 12 + Math.random() * 5; i++) {
                    sleep(5000 + Math.random() * 10000)
                    swipe(540, 800 + Math.random() * 100, 540, 500 + Math.random() * 100, 300)
                    toast('当前为第' + readCounts + '篇文章,约已阅读' + (i + 1) * 10 + '秒')
                }
            } else {
                sleep(20000)
            }

            share_mark_comment()

            backToHomePage()
            swipe(540, p.bounds().bottom, 540, 200, 1000)
        } else {
            failedCounts++
            swipe(540, device.height - 500, 540, 200, 200)
            sleep(200)
        }
    }
    toastLog('article read done')
}

function watchVideos() {
    if (!isMainPage()) {
        enterMainPage()
    }
    toastLog('video watch begin')
    //id('home_bottom_tab_button_contact').findOne(1000).click()

    smartClick(text('电视台').findOne(1000))
    sleep(3000)
    smartClick(text('联播频道').findOne(1000))
    sleep(3000)
    date_yesterday = getDay('Yesterday')

    for (var readCounts = 0, failedCounts = 0; readCounts < 8 && failedCounts < 3;) {
        //var p = text(date_yesterday).findOne(1000)
        var p = boundsInside(200, 300, device.width - 200, device.height - 200).text(date_yesterday).findOne(1000)
        if (p) {
            readCounts++
            smartClick(p)
            sleep(3000)
            smartClick(text('继续播放').findOne(1000))
            sleep(3000)

            if (!debugMode) {
                for (var i = 0; i < 30 + Math.random() * 5; i++) {
                    if (text('重新播放').exists()) {
                        break
                    }
                    sleep(10000)
                    toast('当前为第' + readCounts + '个视频,已观看' + (i + 1) * 10 + '秒')
                }
            } else {
                sleep(20000)
            }

            backToHomePage()
            swipe(540, p.bounds().bottom, 540, 200, 1000)
        } else {
            failedCounts++
            swipe(540, device.height - 500, 540, 200, 200)
            sleep(200)
        }
    }
    toastLog('video watch done')
}

function isMainPage() {
    //return packageName('cn.xuexi.android').id('comm_head_title').exists()
    return text('我的').exists()
}

function backToHomePage() {
    for (var i = 0; i < 6; i++) {
        if (!isMainPage()) {
            back()
            sleep(1000 + Math.random() * 1000)
        }
    }
}

function getDay(strDay) {
    var t = 0
    if (strDay == 'Yesterday') {
        t = 24 * 60 * 60 * 1000
    }
    var myDate = new Date()
    myDate.setTime(myDate.getTime() - t)
    var Y = myDate.getFullYear().toString()
    var M = (myDate.getMonth() + 1).toString()
    if (M < 10)
        M = '0' + M
    var D = myDate.getDate().toString()
    if (D < 10)
        D = '0' + D
    return Y + '-' + M + '-' + D
}

function share_mark_comment() {
    if (storage.get('shareMarkCommentRunTimes') < 3) {
        storage.put('shareMarkCommentRunTimes', storage.get('shareMarkCommentRunTimes') + 1)

        var p = textContains('欢迎发表你的观点').findOne(1000)
        p.parent().child(2).click()//mark
        sleep(3000)
        p.parent().child(3).click()//share
        sleep(3000)
        smartClick(textContains('微信').findOne(5000))
        sleep(3000)
        back()
        sleep(3000)

        smartClick(p)
        //p.parent().child(1).click()//comment
        className('android.widget.EditText').findOne().setText("不忘初心,牢记使命")
        sleep(2000)
        smartClick(text('发布').findOne(1000))
        sleep(15000 + Math.random() * 10000)
        smartClick(text('删除').findOne(3000))
        sleep(2000)
        smartClick(text('确认').findOne(3000))
        sleep(2000)
    }
}

function watchLocalChannel() {
    smartClick(desc('学习').findOne(1000))
    sleep(3000)
    smartClick(text('浙江').findOne(1000))
    sleep(3000)
    smartClick(text('浙江卫视').findOne(1000))
    sleep(20000)
    back()
    sleep(3000)
}

function smartClick(widget) {
    if (widget) {
        if (widget.clickable() && widget.className() != "android.widget.FrameLayout") {
            widget.click()
            return true
        } else {
            var widget_temp = widget.parent()
            for (var triedTimes = 0; triedTimes < 5; triedTimes++) {
                if (widget_temp.clickable()) {
                    widget_temp.click()
                    return true
                }
                widget_temp = widget_temp.parent()
                if (!widget_temp) {
                    break
                }
            }

            click(widget.bounds().centerX(), widget.bounds().centerY())
            return true
        }
    } else {
        // console.verbose('invalid widget')
        if (debugMode)
            console.trace('invalid widget : ')
        return false
    }
}








































