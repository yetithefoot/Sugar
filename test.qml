import QtQuick 2.5
import "sugar.js" as Sugar

Item {
    Component.onCompleted: {
        Sugar = Sugar.mofo;
        console.log('-------------------------');
        console.log(Sugar);
        console.log(Sugar);
        console.log(Sugar.Date);
        console.log(Sugar.Date.create);
        console.log(Sugar.Date.addWeeks);
        console.log('-------------------------');
        var r = Sugar.Date.range(Sugar.Date.create("26 May 22:00"), Sugar.Date.create("27 May 04:00"));
        console.log(r.every("30 minutes"));
    }
}
