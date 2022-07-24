const defaultPassword = [1, 2, 3, 4, 5, 6]; //本地配置优先，未配置则密码按照这个格式自行修改

let deviceUnlocker = {};
deviceUnlocker.unlockDevice = function () {
    let storage_privateinfo = storages.create("privateInformation");
    let password = storage_privateinfo.get("screenUnlockCode");
    if (!password) {
        password = defaultPassword;
    }
    if (device.isScreenOn()) {
        log("screen on");
        sleep(3000); // 延时启动 方便调试
    }
    let batteryLevel = device.getBattery();
    log("battery level : " + batteryLevel);
    if (batteryLevel < 10 && !device.isCharging()) {
        log("电量低,屏幕解锁未执行");
        alert("电量低,屏幕解锁未执行");
        return false;
    }
    if (!device.isScreenOn()) {
        log("unlocking device");
        device.wakeUp();

        sleep(1000);
        if (!device.isScreenOn()) {
            console.warn("error:  screen still off!!!");
            sleep(500);
        }

        swipe(device.width / 2, device.height * 0.9, device.width / 2, device.height * 0.1, 500);
        sleep(1000);

        if (!desc(0).exists()) {
            swipe(device.width / 2, device.height * 0.9, device.width / 2, device.height * 0.1, 2000);
            sleep(1000);
        }

        if (!desc(0).exists()) {
            sleep(3 * 60 * 1000);
            swipe(device.width / 2, device.height * 0.9, device.width / 2, device.height * 0.1, 2000);
            sleep(1000);
        }

        for (let i = 0; i < password.length; i++) {
            desc(password[i]).findOne(10000).click();
        }
        sleep(1000);

        // 返回桌面 解锁结束
        switch (device.brand) {
            case "OnePlus": {
                for (let i = 0; i < 10; i++) {
                    if (currentActivity() != "com.android.launcher.Launcher") {
                        log("returning home");
                        home();
                        sleep(200);
                    }
                }

                if (currentActivity() == "com.android.launcher.Launcher") {
                    toastLog("device unlocked");
                    return true;
                } else {
                    console.error("unlock device failed");
                    return false;
                }
            }

            default:
                return true;
        }
    }
};

module.exports = deviceUnlocker;

// 单元测试已通过
// unlockDevice()
