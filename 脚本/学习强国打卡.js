//encoding：UTF-8
//Author:G大师
//支持：阅读文章（12分）、浏览视频（12分）、每日答题（5分，纯瞎蒙，容易触发人机验证，不稳定，需手动开启），加登录、评论、本地频道各一分合计每日32分。
//测试模式：不包含浏览时长，验证流程用
//熄屏调用默认完全模式
//需要权限：无障碍权限（分析布局并模拟点击）、存储权限（本地数据库）、悬浮窗权限（弹出式通知）、修改系统设置权限（刷视频时自动静音）、通知权限（提示脚本运行状态）、读取应用列表、关联启动（启动学习强国）
/////////////////////////////////////////////////////////////////////////////////////
auto(); //检查无障碍权限
requiresApi(24); //安卓7以上版本

let debugMode = false;
let targetAverageScore = 35; //目标周平均分，未达标则触发提醒
let deviceUnlocker = require("解锁屏幕.js"); //需要另一个解锁屏幕的脚本
let isScreenNeedToBeLocked; //有root权限时会根据情况自动锁屏
let isScreenNeedToBeDimed; //是否需要调整亮度
let thread_main; //主线程
let thread_main_monitor; //防主线程卡死超时
let storage_xxqg = storages.create("XXQG"); // 本地存储数据库 存储本周初始积分
const IsRooted = files.exists("/sbin/su") || files.exists("/system/xbin/su") || files.exists("/system/bin/su"); //检测Root权限

//////////////////////////////////////begin/////////////////////////////////////////
initialize();

function initialize() {
    let checkBoxCounts = 0;

    if (device.isScreenOn()) {
        isScreenNeedToBeLocked = true;
        isScreenNeedToBeDimed = false;
        let choiceMade;
        let dialog_start = dialogs
            .build({
                title: "是否开始学习强国打卡?",
                content: "按音量上键取消执行、按空白处延时执行",
                positive: "确认",
                negative: "说明",
                neutral: "取消",
                checkBoxPrompt: "测试模式",
                checkBoxChecked: false,
            })
            .on("any", (action, dialog) => {
                choiceMade = action;
            })
            .on("check", (checked) => {
                checkBoxCounts++;
                if (checkBoxCounts % 5 == 0) {
                    let isDailyQuizEnabled = storage_xxqg.get("isDailyQuizEnabled") || false;
                    storage_xxqg.put("isDailyQuizEnabled", !isDailyQuizEnabled);
                    if (isDailyQuizEnabled) {
                        toastLog("每日答题功能已关闭");
                    } else {
                        toastLog("每日答题功能已启用");
                    }
                }
                if (checked) {
                    toast("测试模式预计五分钟,无时长分");
                }
                debugMode = checked;
            })
            .on("dismiss", (dialog) => {
                if (choiceMade == "positive") {
                    thread_main = threads.start(main);
                    thread_main_monitor = threads.start(main_monitor);
                } else if (choiceMade == "negative") {
                    alert("提供阅读文章与浏览视频等功能，预计每日20~30分，点击测试模式五次开关每日答题功能");
                    sleep(1000);
                    initialize();
                } else if (choiceMade == "neutral") {
                    toastLog("脚本已终止");
                    exit();
                    //let delayTime = dialogs.input("延时时间(min):", "10");
                    //sleep(delayTime * 60 * 1000);
                    //initialize();
                } else {
                    toastLog("脚本将在半小时后运行");
                    sleep(30 * 60 * 1000);
                    initialize();
                }
            });

        dialog_start.show();
    } else {
        if (device.getBattery() < 20 && !device.isCharging()) {
            // 低电量保护
            console.error("电量低", "电量低 脚本未执行");
            alert("电量低", "电量低 脚本未执行");
            exit();
        }
        isScreenNeedToBeLocked = false;
        isScreenNeedToBeDimed = true;
        if (deviceUnlocker.unlockDevice()) {
            thread_main = threads.start(main);
            thread_main_monitor = threads.start(main_monitor);
        } else {
            threads.start(function () {
                alert("错误", "解锁屏幕失败");
            });
            log("解锁屏幕失败,脚本已结束");

            getScreenCaptureAuthority();
            files.create("./日志/");
            images.save(captureScreen(), "/日志/" + getDateStr("Today") + "_解锁屏幕失败.jpg", "jpg", 50);
            exit();
        }
    }
}

function main() {
    let initialMediaVolume = device.getMusicVolume();
    device.setMusicVolume(0); //TODO 有概率失效
    let initialBrightness = device.getBrightness();
    let initialBrightnessMode = device.getBrightnessMode();
    //device.keepScreenDim(3600 * 1000);
    if (isScreenNeedToBeDimed) {
        device.setBrightnessMode(0);
        device.setBrightness(0);
    }

    enterMainPage();
    sleep(1000);
    logScore();
    if (debugMode) {
        checkScore();
        dailyQuiz();
        readArticles(6);
        watchVideos(6);
    } else {
        readArticles(8); //有概率点到视频啥的就不作数了
        watchVideos(8);
    }

    watchLocalChannel();

    if (storage_xxqg.get("isDailyQuizEnabled") || false) {
        dailyQuiz();
    }

    checkScore();
    sleep(1000);
    toastLog("学习强国打卡已结束");
    home();
    //device.cancelKeepingAwake();
    device.setMusicVolume(initialMediaVolume);
    if (isScreenNeedToBeDimed) {
        device.setBrightness(initialBrightness);
        device.setBrightnessMode(initialBrightnessMode);
    }
    sleep(2000);
    if (IsRooted) {
        shell("am force-stop cn.xuexi.android", true);
        if (isScreenNeedToBeLocked) {
            KeyCode(26);
        }
    }
}

function main_monitor() {
    for (let i = 0; i < 60 * 60; i++) {
        sleep(1000);
    }
    if (thread_main) {
        thread_main.interrupt();
        console.error("学习强国打卡超时");
        threads.start(function () {
            alert("错误", "学习强国打卡超时");
        });
        getScreenCaptureAuthority();
        files.create("./日志/");
        images.save(captureScreen(), "/日志/" + getDateStr("Today") + "_超时.jpg", "jpg", 50);
        exit();
    } else {
        log("thread_main_monitor terminated");
    }
}

function isMainPage() {
    if (text("我的").exists()) {
        if (text("我的").findOne(100).bounds().centerX() > device.width * 0.7) {
            return true;
        }
    }
    return false;
}

function backToHomePage() {
    for (let i = 0; i < 6; i++) {
        if (!isMainPage()) {
            back();
            sleep(2000);
            if (textContains("加入书架").exists()) {
                smartClick(text("取消").findOne(1000));
            }
            if (textContains("确定要退出答题").exists()) {
                smartClick(text("退出").findOne(1000));
            }
        } else {
            break;
        }
    }
}

// 启动学习强国
function enterMainPage() {
    launchApp("学习强国");
    sleep(1000);
    //toast("等待学习强国启动");
    for (let i = 0; i < 20; i++) {
        if (!isMainPage()) {
            sleep(1000);
        } else {
            break;
        }
    }
    sleep(1000);

    backToHomePage(); //如果还未加载主界面 可能停留在内部页面 返回主界面

    if (!isMainPage()) {
        //如果加载失败
        console.error("主界面加载失败");
        threads.start(function () {
            alert("错误", "主界面加载失败,脚本未执行");
        });
        getScreenCaptureAuthority();
        files.create("./日志/");
        images.save(captureScreen(), "/日志/" + getDateStr("Today") + "_主界面加载失败.jpg", "jpg", 50);
        exit();
    }
}

function logScore() {
    //周一则记录初始分数
    backToHomePage();
    if (new Date().getDay() == 1) {
        if (storage_xxqg.get("lastRecordDate") != new Date().getDate()) {
            storage_xxqg.put("lastRecordDate", new Date().getDate());
            let currentScore = text("积分").findOne(3000).parent().child(1).text();
            storage_xxqg.put("initialScore", currentScore);
        }
    }
}

function checkScore() {
    //周日则检查平均积分
    toastLog("checking score");
    backToHomePage();
    if (new Date().getDay() == 0) {
        initialScore = storage_xxqg.get("initialScore") || 0;
        toastLog("初始积分为：" + initialScore);
        let currentScore = text("积分").findOne(3000).parent().child(1).text();
        toastLog("当前积分为：" + currentScore);
        let averageScore = (currentScore - initialScore) / 7;
        toastLog("平均积分为：" + averageScore);
        if (averageScore < targetAverageScore) {
            weChatPush("title", "学习强国积分未达标", "content", "本周平均每日积分为：" + averageScore + "\n今日需获得" + (targetAverageScore - averageScore) * 7 + "积分方可达标");
        } else {
            log("本周平均积分为：" + averageScore + "，已达标");
        }
    }
}

// 得到当日日期字符串用于定位文章，格式YYYY-MM-DD，默认当天，可加“Yesterday”指定昨天
function getDateStr(strDay) {
    let t = 0;
    if (strDay == "Yesterday") {
        t = 24 * 60 * 60 * 1000;
    }
    let myDate = new Date();
    myDate.setTime(myDate.getTime() - t);
    let Y = myDate.getFullYear().toString();
    let M = (myDate.getMonth() + 1).toString();
    if (M < 10) M = "0" + M;
    let D = myDate.getDate().toString();
    if (D < 10) D = "0" + D;
    return Y + "-" + M + "-" + D;
}

// 学习文章
function readArticles(numOfArticlesToRead) {
    let isShared = true; //好像现在不需要分享了
    let isStarred = true; //好像现在不需要收藏了
    let isCommented = false; //需要评论一次
    toastLog("article read begin");
    if (!isMainPage()) {
        enterMainPage();
    }
    if (desc("工作").findOne(3000)) {
        smartClick(desc("工作").findOne(3000));
        sleep(1000);
        smartClick(desc("工作").findOne(3000));
        sleep(1000);
    } else {
        click(device.width / 2, device.height - 100);
    }

    let p = boundsInside(1, device.height * 0.1, device.width * 0.9, device.height * 0.9)
        .text("推荐")
        .findOne(1000);
    smartClick(p);
    sleep(1000);

    let dateStr;
    if (new Date().getHours() > 8) {
        dateStr = getDateStr("Today");
    } else {
        dateStr = getDateStr("Yesterday");
    }

    let readCounts = 0;
    let failedCounts = 0;
    for (; readCounts < numOfArticlesToRead && failedCounts < 5; ) {
        sleep(1000);
        let p = boundsInside(device.width * 0.1, device.height * 0.1, device.width * 0.9, device.height * 0.9)
            .text(dateStr)
            .findOne(1000);
        if (p) {
            smartClick(p);
            sleep(5000);
            if (textContains("播放").exists()) {
                //如果是视频就跳过
                backToHomePage();
                swipe(device.width / 2, device.height * 0.7, device.width / 2, device.height * 0.2, 500);
                sleep(1000);
                continue;
            } else {
                readCounts++;
            }
            // click(article.bounds().centerX(), article.bounds().centerY())
            sleep(2000);
            toastLog("开始阅读第" + readCounts + "篇/共" + numOfArticlesToRead + "篇");
            sleep(1000);
            if (!isStarred) {
                toast("收藏中");
                click((865 * device.width) / 1080, device.height - 60);
                sleep(1000);
                isStarred = true;
            }
            if (!isShared) {
                toast("分享中");
                click((1000 * device.width) / 1080, device.height - 60);
                smartClick(textContains("分享给微信").findOne(5000));
                sleep(5000);
                back();
                sleep(3000);
                isShared = true;
            }
            if (!isCommented) {
                toast("评论中");
                smartClick(textContains("欢迎发表你的观点").findOne(1000));
                sleep(2000);
                className("android.widget.EditText").findOne().setText("为祖国点赞");
                sleep(1500);
                smartClick(text("发布").findOne(1000));
                sleep(2000);
                //发完再删了
                smartClick(text("删除").findOne(3000));
                sleep(1000);
                smartClick(text("确认").findOne(3000));
                sleep(1000);
                isCommented = true;
            }
            //非测试模式则获取浏览时长分
            if (!debugMode) {
                for (let i = 0; i < 8; i++) {
                    sleep(8000 + Math.random() * 4000);
                    swipe(device.width / 2, device.height * (0.7 + Math.random() * 0.2), device.width / 2, device.height * (0.2 + Math.random() * 0.2), 1000);
                    toast("当前为第" + readCounts + "篇文章,约已阅读" + (i + 1) * 10 + "秒");
                }
            }
            backToHomePage();
            swipe(device.width / 2, p.bounds().bottom + 100, device.width / 2, 300, 1000);
            sleep(1000);
        } else {
            failedCounts++;
            swipe(device.width / 2, device.height * 0.7, device.width / 2, device.height * 0.2, 500);
            sleep(200);
            toastLog("failed to locate number" + (readCounts + 1) + " passage after " + failedCounts + " times");
        }
    }
}

// 观看视频
function watchVideos(numOfVediosToWatch) {
    if (!isMainPage()) {
        enterMainPage();
    }

    toastLog("video watch begin");
    smartClick(text("电视台").findOne(1000));
    sleep(3000);
    smartClick(text("联播频道").findOne(1000));
    sleep(3000);

    let dateStr;
    if (new Date().getHours() > 21) {
        dateStr = getDateStr("Today");
    } else {
        dateStr = getDateStr("Yesterday");
    }

    let watchCounts = 0;
    let failedCounts = 0;
    for (; watchCounts < numOfVediosToWatch && failedCounts < 5; ) {
        sleep(1000);
        let p = boundsInside(device.width * 0.1, device.height * 0.1, device.width * 0.9, device.height * 0.9)
            .text(dateStr)
            .findOne(1000);
        if (p) {
            smartClick(p);
            watchCounts++;
            sleep(3000);
            if (textContains("新闻联播").exists() && !debugMode) {
                sleep(3 * 60 * 1000); //多刷点时长防止其他短视频凑不够总时长
            }
            smartClick(text("继续播放").findOne(1000));
            sleep(1000);
            click(device.width / 2, 300 * (device.width / 1080));
            sleep(1000);
            toastLog("开始看第" + watchCounts + "个视频/共" + numOfVediosToWatch + "个");
            //非测试模式则获取浏览时长分
            if (!debugMode) {
                for (let i = 0; i < 6; i++) {
                    sleep(8000 + Math.random() * 4000);
                    swipe(device.width / 2, device.height * (0.7 + Math.random() * 0.2), device.width / 2, device.height * (0.2 + Math.random() * 0.2), 1000);
                    toast("当前为第" + watchCounts + "个视频,约已观看" + (i + 1) * 10 + "秒");
                }
            }
            backToHomePage();
            swipe(device.width / 2, p.bounds().bottom + 100, device.width / 2, 300, 1000);
            sleep(1000);
        } else {
            failedCounts++;
            swipe(device.width / 2, device.height * 0.7, device.width / 2, device.height * 0.2, 500);
            sleep(200);
        }
    }
    toastLog("video watch done");
}

function dailyQuiz() {
    backToHomePage();
    if (!isMainPage()) {
        enterMainPage();
    }
    toastLog("daily quiz entering");
    click(text("积分").findOne(3000).parent().bounds().centerX(), text("积分").findOne(3000).parent().bounds().centerY());
    sleep(3000);
    if (text("成长总积分").findOne(3000)) {
        text("每日答题").findOne(1000).parent().parent().child(3).click();
    }
    toastLog("daily quiz begin");

    let correctCounts = 0;
    let loopCounts = 0;

    for (; loopCounts < 100; loopCounts++) {
        sleep(1000);
        if (className("android.widget.EditText").findOne(100)) {
            className("android.widget.EditText").findOne(100).setText("阿巴阿巴");
            sleep(100);
        } else {
            smartClick(text("A.").findOne(100));
            sleep(1000);
            smartClick(text("B.").findOne(100));
            sleep(100);
            smartClick(text("C.").findOne(100));
            sleep(100);
            smartClick(text("D.").findOne(100));
            sleep(100);
        }
        smartClick(text("确定").findOne(1000));
        sleep(1000);

        if (text("下一题").findOne(100)) {
            smartClick(text("下一题").findOne(100));
            sleep(1000);
        } else {
            if (text("完成").findOne(100)) {
                smartClick(text("完成").findOne(100));
                sleep(1000);
            } else {
                correctCounts++; //没提示下一题说明做对了
            }
        }

        toastLog("当前已蒙对" + correctCounts + "题/5题");

        for (let i = 0; i < 5; i++) {
            if (textContains("访问异常").findOne(100)) {
                toastLog("进行访问异常验证");
                swipe(device.width * 0.2, device.height / 2, device.width * 0.9, device.height / 2, (i + 1) * 300);
                sleep(2000);
            } else {
                break;
            }
        }
        if (correctCounts >= 5) {
            if (text("返回").findOne(1000)) {
                smartClick(text("返回").findOne(1000));
                sleep(1000);
                backToHomePage();
                break;
            }
        } else {
            smartClick(text("再来一组").findOne(1000));
        }
    }
    if (loopCounts == 100) {
        console.error("每日答题已超时");
    }
    toastLog("daily quiz finished");
    backToHomePage();
}

function watchLocalChannel() {
    if (!isMainPage()) {
        enterMainPage();
    }
    click(text("积分").findOne(3000).parent().bounds().centerX(), text("积分").findOne(3000).parent().bounds().centerY());
    sleep(3000);
    if (text("成长总积分").findOne(3000)) {
        text("本地频道").findOne(1000).parent().parent().child(3).click();
    }
    toastLog("local channel entered");
    sleep(3000);
    let p = textContains("切换地区").findOne(3000);
    if (p) {
        click(p.bounds().centerX() - device.width * 0.14, p.bounds().centerY() + (device.width / 1080) * 150);
        sleep(3000);
    }
    backToHomePage();
}

function smartClick(widget) {
    if (widget) {
        if (widget.clickable()) {
            widget.click();
            return true;
        } else {
            let widget_temp = widget.parent();
            for (let triedTimes = 0; triedTimes < 5; triedTimes++) {
                if (widget_temp.clickable()) {
                    widget_temp.click();
                    return true;
                }
                widget_temp = widget_temp.parent();
                if (!widget_temp) {
                    break;
                }
            }

            click(widget.bounds().centerX(), widget.bounds().centerY());
            return true;
        }
    } else {
        // console.verbose('invalid widget')
        if (debugMode) {
            console.trace("invalid widget : ");
        }
        return false;
    }
}

function getScreenCaptureAuthority() {
    threads.start(function () {
        for (let i = 0; i < 10; i++) {
            if (smartClick(text("立即开始").findOne(1000)) || smartClick(text("允许").findOne(1000))) {
                break;
            }
        }
    });
    sleep(500);
    requestScreenCapture();
}

//let msgid = weChatPush("wecom_secret", wecom_secret, "wecom_aid", wecom_aid, "wecom_cid", wecom_cid, "wecom_touid", wecom_touid, "content", content, "msgtype", msgtype, "imgurl", imgurl);
function weChatPush() {
    let storage_privateinfo = storages.create("privateInformation");
    let wecom_secret, wecom_aid, wecom_cid, wecom_touid, msgtype, content, title, imgurl, media_id;
    if (arguments.length == 1) {
        content = arguments[0];
    } else {
        for (let i = 0; i < arguments.length; ) {
            let elementDesc = arguments[i++];
            let element = arguments[i++];
            switch (elementDesc) {
                case "content":
                    content = element;
                    break;
                case "title":
                    title = element;
                    break;
                case "wecom_secret":
                    wecom_secret = element;
                    break;
                case "wecom_aid":
                    wecom_aid = element;
                    break;
                case "wecom_cid":
                    wecom_cid = element;
                    break;
                case "wecom_touid":
                    wecom_touid = element;
                    break;
                case "msgtype":
                    msgtype = element;
                    break;
                case "imgurl":
                    imgurl = element;
                    break;
                default:
                    console.error("invaild parament:");
                    console.trace(arguments);
            }
        }
    }

    if (!title) {
        let dateTime = new Date();
        let dateStr = dateTime.toLocaleDateString().substr(5);
        let timeStr = dateTime.toTimeString().substr(0, 5);
        if (msgtype == "markdown") {
            title = "# " + dateStr + timeStr;
        } else {
            title = dateStr + timeStr;
        }
    }
    if (!wecom_secret) {
        wecom_secret = storage_privateinfo.get("wecom_secret");
    }
    if (!wecom_aid) {
        wecom_aid = storage_privateinfo.get("wecom_aid");
    }
    if (!wecom_cid) {
        wecom_cid = storage_privateinfo.get("wecom_cid");
    }
    if (!wecom_touid) {
        wecom_touid = storage_privateinfo.get("wecom_touid");
    }
    if (!msgtype) {
        msgtype = "text";
    }
    if (!imgurl) {
        imgurl = storage_privateinfo.get("imgurl");
        if (!imgurl) {
            imgurl = "http://iw233.cn/api/Random.php";
        }
    }
    get_token_url = "https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=" + wecom_cid + "&corpsecret=" + wecom_secret;
    response = http.get(get_token_url).body.json();
    let access_token = response["access_token"];

    if (msgtype == "image" || msgtype == "mpnews" || msgtype == "news") {
        picture = http.get(imgurl).body.bytes(); //https://acg.yanwz.cn/menhera/api.php
        files.writeBytes("./wxImg_uploadTemp.jpg", picture);
        upload_url = "https://qyapi.weixin.qq.com/cgi-bin/media/upload?access_token=" + access_token + "&type=image";
        let upload_response_json = http.postMultipart(upload_url, { picture: open("./wxImg_uploadTemp.jpg") }).body.json();
        if (upload_response_json["errcode"] != 0) {
            console.error("errcode: " + upload_response_json["errcode"]);
            console.error("errmsg: " + upload_response_json["errmsg"]);
            return;
        } else {
            media_id = upload_response_json["media_id"];
        }
    }

    if (access_token.length > 0) {
        send_msg_url = "https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=" + access_token;
        data = {
            touser: wecom_touid,
            agentid: wecom_aid,
            msgtype: msgtype,
            duplicate_check_interval: 600,
            text: {
                content: title + "\r\n" + content,
            },
            markdown: {
                content: title + "\r\n" + content,
            },
            image: {
                media_id: media_id,
            },
            news: {
                articles: [
                    {
                        title: title,
                        description: content,
                        url: "www.github.com",
                        picurl: imgurl, //"https://acg.yanwz.cn/menhera/api.php",
                    },
                ],
            },
            mpnews: {
                articles: [
                    {
                        title: title,
                        thumb_media_id: media_id,
                        author: "G大师",
                        content_source_url: "www.github.com",
                        content: "广告位招租",
                        digest: content,
                    },
                ],
            },
        };
        let response_body = http.postJson(send_msg_url, data).body.json();
        if (response_body["errcode"] == 0) {
            return response_body["msgid"];
        } else {
            console.error("errmsg: " + response_body["errmsg"]);
            return;
        }
    }
}
