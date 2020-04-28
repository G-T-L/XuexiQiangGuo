

auto()
requiresApi(24)

var storage
var thread_main
var thread_main_monitor
var deviceUnlocker = require('解锁屏幕.js')


thread_main = threads.start(main)

thread_main_monitor = threads.start(function () {
    for (var i = 0; i < 60 * 60; i++) {
        sleep(1000)
    }
    if (thread_main) {
        thread_main.interrupt()
        console.error('学习强国分数检查脚本超时')
    }
})

function main() {
    waitUntilIdle()
    deviceUnlocker.unlockDevice()
    launchApp('学习强国')
    sleep(5000)

    if (!isMainPage()) {
        sleep(5000)
    }
    if (!isMainPage()) {  //如果加载失败
        console.error('主界面加载失败')
        threads.start(function () {
            alert('错误', '主界面加载失败,脚本未执行')
        })
        exit()
    }
    storage = storages.create('XueXiQiangGuoDataLog')

    var gainedScore
    //var score = id('comm_head_xuexi_score').findOne(1000).text()
    var totalScore = text('积分').findOne(1000).parent().child(1).text()
    if (storage.get('lastScoreUpdateDate') == new Date().getDate()) {
        gainedScore = totalScore - storage.get('lastTotalScore')
    }

    if (gainedScore < 30) {
        threads.start(function () {
            alert('提示', '今日积分可能未满30,还差' + (30 - gainedScore) + '分')
        })
    } else {
        log('今日积分已达标')
    }
    thread_main_monitor.interrupt()
    home()
}

function waitUntilIdle() {
    while (device.isScreenOn()) {
        sleep(60 * 1000)
    }
    sleep(10000)
    if (device.isScreenOn()) {
        waitUntilIdle()
    } else {
        return
    }

}

function isMainPage() {
    //return packageName('cn.xuexi.android').id('comm_head_title').exists()
    return text('我的').exists()
}

function smartClick(widget) {
    if (widget) {
        if (widget.clickable()) {
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
        console.trace('invalid widget : ')
        return false
    }
}



