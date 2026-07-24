import React, { Component } from 'react'
import { Button, Radio, RadioGroup } from "@blueprintjs/core"
import { connect } from 'react-redux'
import { shell } from 'electron'
export const windowMode = false;
const { BrowserWindow } = require('electron').remote;
const { i18n } = window;


const parseShip = (ship) => {
    let tempObj =
    {
        "api_id": ship.api_id,
        "api_ship_id": ship.api_ship_id,
        "api_lv": ship.api_lv,
        "api_kyouka": ship.api_kyouka,
        "api_exp": ship.api_exp,
        "api_slot_ex": ship.api_slot_ex
    }
    
    // 活动贴条只在存在时添加
    if (ship.api_sally_area !== undefined) {
        tempObj.api_sally_area = ship.api_sally_area;
    }
    
    // 添加缎带信息 (api_sp_effect_items)
    if (ship.api_sp_effect_items && ship.api_sp_effect_items.length) {
        tempObj.api_sp_effect_items = ship.api_sp_effect_items;
    }

    return tempObj;
}



const parseEquip = (equip) => {
    let tempObj =
    {
        "id": equip.api_slotitem_id,
        "lv": equip.api_level
    }

    if(equip.api_level == undefined) {
        tempObj.lv = 0;
    }

    return tempObj;
}



const copyToClipboard = (result) => {
    const content = document.createElement('input'),
    text = result;
    document.body.appendChild(content);
    content.value = text;
    content.select();
    document.execCommand('copy');
    document.body.removeChild(content);
}



export const reactClass = connect(state => ({
    hqlv: state.info.basic.api_level,
    fleets: state.info.fleets,
    ships: state.info.ships,
    equips: state.info.equips,
    airbases: state.info.airbase
}))(class View extends Component {

    state = { 
        result: "",
        shipExportType: "locked",
        equipExportType: "all",
        airbaseAreaId: "event"  // "event" (活动海域, >=30), "central" (中部海域, 6), "southwest" (南西海域, 7)
    };

    //导出舰队和陆航信息
    exportFleet = () => {
        const fleets = this.props.fleets;
        const ships = this.props.ships;
        const equips = this.props.equips;
        const airbases = this.props.airbases;
        let result = `{"version": 4,"hqlv":${this.props.hqlv},`;

        //遍历母港中的舰队并且生成json
        for (let i = 0; i < fleets.length; i++) {
            const fleet = fleets[i];
            result += `"f${i + 1}":{`;
            //遍历舰队中的船只
            for (let j = 0; j < fleet.api_ship.length; j++) {
                if (ships[fleet.api_ship[j]]) {
                    const ship = ships[fleet.api_ship[j]];
                    result += `"s${j + 1}":{"id":${ship.api_ship_id},"lv":${ship.api_lv},"luck":${ship.api_lucky[0]}`;
                    
                    if (ship.api_sally_area !== undefined) {
                        result += `,"area":${ship.api_sally_area}`;
                    }

                    // 添加缎带信息 (spi 格式用于 DeckBuilder)
                    if (ship.api_sp_effect_items && ship.api_sp_effect_items.length) {
                        result += `,"spi":${JSON.stringify(ship.api_sp_effect_items.map(item => ({
                            kind: item.api_kind,
                            fp: item.api_kind === 2 ? 2 : 0,
                            tp: 1,
                            ar: 1,
                            ev: item.api_kind === 2 ? 2 : 0
                        })))}`;
                    }
                    
                    result += `,"items":{`;
                    //遍历船只的装备
                    for (let k = 0; k < ship.api_slot.length; k++) {
                        const slot = ship.api_slot[k];
                        if (equips[slot]) {
                            const equip = equips[slot];
                            result += `"i${k + 1}":{"id":${equip.api_slotitem_id},"rf":${equip.api_level}`
                            if (equip.api_alv) {
                                result += `,"mas":${equip.api_alv}`
                            }
                            result += `},`
                        }
                    }
                    //查看是否存在额外装备（孔）
                    if (equips[ship.api_slot_ex]) {
                        const equip = equips[ship.api_slot_ex]
                        result += `"ix":{"id":${equip.api_slotitem_id},"rf":${equip.api_level}`
                        if (equip.api_alv) {
                            result += `,"mas":${equip.api_alv}`
                        }
                        result += `}`
                    }
                    //去除最后的逗号并且补上items的后括号
                    if (result.charAt(result.length - 1) == ',') {
                        result = result.slice(0, result.length - 1) + `}`
                    } else {
                        result += `}`
                    }
                    //补上ships的后括号
                    result += `},`
                }
            }
            //去除最后的逗号并且补上fleets的后括号
            if (result.charAt(result.length - 1) == ',') {
                result = result.slice(0, result.length - 1) + `},`
            } else {
                result += `},`
            }
        }
        //遍历陆航中的航空中队
        let airbase_cnt = 0;
        for (let i = 0; i < airbases.length; i++) {
            const airbase = airbases[i];
            // 根据选择的海域筛选陆航
            const areaId = this.state.airbaseAreaId;
            if (areaId === "event" && airbase.api_area_id < 30) continue;
            if (areaId === "central" && airbase.api_area_id !== 6) continue;
            if (areaId === "southwest" && airbase.api_area_id !== 7) continue;
            airbase_cnt += 1;
            result += `"a${airbase_cnt}":{"items": {`;
            //遍历航空中队中的飞机
            for (let j = 0; j < airbase.api_plane_info.length; j++) {
                const plane = airbase.api_plane_info[j];
                if (equips[plane.api_slotid]) {
                    const equip = equips[plane.api_slotid]
                    result += `"i${j + 1}":{"id":${equip.api_slotitem_id},"rf":${equip.api_level}`
                    if (equip.api_alv) {
                        result += `,"mas":${equip.api_alv}`
                    }
                    result += `},`
                }
            }
            //去除最后的逗号并且补上items的后括号
            if (result.charAt(result.length - 1) == ',') {
                result = result.slice(0, result.length - 1) + `},`
            } else {
                result += `},`
            }
            //加上航空中队的行动状态
            result += `"mode":${airbase.api_action_kind}},`
        }
        //去除最后的逗号并且补上json字符串的后括号
        if (result.charAt(result.length - 1) == ',') {
            result = result.slice(0, result.length - 1) + `}`
        } else {
            result += `}`
        }
        return result;
    }

    //舰娘数据导出(包含未锁定)
    //另外3个函数代码大致相同
    exportShipsAll = () => {
        //读取数据
        const ships = this.props.ships;
        let result = []
        Object.keys(ships).forEach((key) => {
            const ship = ships[key]
            result.push(parseShip(ship))
        })
        let strResult = JSON.stringify(result)
        this.setState({ result: strResult })

        //复制到剪贴板
        copyToClipboard(strResult)

        return result;
    }



    //舰娘数据导出(不包含未锁定)
    exportShipsLocked = () => {
        const ships = this.props.ships;
        let result = []
        Object.values(ships)
            .filter(ship => {
                // 修复：兼容数字和字符串类型的锁定状态
                return ship.api_locked == "1" || ship.api_locked == 1
            }).forEach(ship => {
                result.push(parseShip(ship))
            })

        let strResult = JSON.stringify(result)
        this.setState({ result: strResult })

        //复制到剪贴板
        copyToClipboard(strResult)

        return result;
    }



    //装备数据导出(包含未锁定)
    exportEquipsAll = () => {
        const equips = this.props.equips;
        let result = [];

        Object.keys(equips).forEach((key) => {
            const equip = equips[key];
            if (equip) {
                if (equip.api_level === undefined) {
                    result.push({ "id": equip.api_slotitem_id, "lv": 0 });
                } else {
                    result.push({ "id": equip.api_slotitem_id, "lv": equip.api_level });
                }
            }
        });

        let strResult = JSON.stringify(result);
        this.setState({ result: strResult });

        // 复制到剪贴板
        copyToClipboard(strResult);

        return result;
    }



    //装备数据导出(不包含未锁定)
    exportEquipsLocked = () => {
        const equips = this.props.equips;
        let result = `[`;
        const len = Object.keys(equips).pop();

        for (let j = 0; j < len; j++) {
            if (equips[j]) {
                const equip = equips[j];
                // 修复：只有当api_locked明确为1或"1"时才认为是锁定状态
                if (equip.api_locked != "1" && equip.api_locked != 1) {
                    continue;
                }
                if(equip.api_level == undefined) {
                    result += `{"id":${equip.api_slotitem_id},"lv":0},`
                }
                else {
                    result += `{"id":${equip.api_slotitem_id},"lv":${equip.api_level}},`
                }
            }
        }
        if (result.charAt(result.length - 1) == ',') {
            result = result.slice(0, result.length - 1)
        }
        result += `]`

        this.setState({ result })

        copyToClipboard(result)

        return result;
    }



    openNewPage = () => {
        const fleetData = this.exportFleet();
        
        // 根据当前选择导出舰娘数据
        let ships;
        if (this.state.shipExportType === 'all') {
            ships = Object.keys(this.props.ships).map(key => parseShip(this.props.ships[key]));
        } else {
            ships = Object.values(this.props.ships)
                .filter(ship => ship.api_locked == "1" || ship.api_locked == 1)
                .map(ship => parseShip(ship));
        }
        
        // 根据当前选择导出装备数据
        let items;
        if (this.state.equipExportType === 'all') {
            items = [];
            Object.keys(this.props.equips).forEach((key) => {
                const equip = this.props.equips[key];
                if (equip) {
                    items.push({ "id": equip.api_slotitem_id, "lv": equip.api_level || 0 });
                }
            });
        } else {
            items = [];
            const len = Object.keys(this.props.equips).pop();
            for (let j = 0; j < len; j++) {
                const equip = this.props.equips[j];
                if (equip && (equip.api_locked == "1" || equip.api_locked == 1)) {
                    items.push({ "id": equip.api_slotitem_id, "lv": equip.api_level || 0 });
                }
            }
        }

        // 构建完整的导入数据对象
        const predeck = JSON.parse(fleetData);
        const importData = { predeck, ships, items };
        const url = `https://noro6.github.io/kc-web#import:${JSON.stringify(importData)}`;
        
        // 从本地存储读取上次的窗口大小
        const savedBounds = localStorage.getItem('noro6-window-bounds');
        let windowOptions = {
            width: 1400,
            height: 900,
            show: false,
            autoHideMenuBar: true,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true
            }
        };
        
        // 如果有保存的窗口大小，使用保存的值
        if (savedBounds) {
            try {
                const bounds = JSON.parse(savedBounds);
                windowOptions.width = bounds.width;
                windowOptions.height = bounds.height;
                if (bounds.x !== undefined && bounds.y !== undefined) {
                    windowOptions.x = bounds.x;
                    windowOptions.y = bounds.y;
                }
            } catch (e) {
                console.error('Failed to parse saved window bounds:', e);
            }
        }
        
        // 在poi内部窗口打开
        const newWindow = new BrowserWindow(windowOptions);
        
        newWindow.setMenuBarVisibility(false);
        
        newWindow.once('ready-to-show', () => {
            newWindow.show();
        });
        
        // 保存窗口大小和位置
        const saveBounds = () => {
            const bounds = newWindow.getBounds();
            localStorage.setItem('noro6-window-bounds', JSON.stringify(bounds));
        };
        
        // 监听窗口大小变化
        newWindow.on('resize', saveBounds);
        newWindow.on('move', saveBounds);
        
        // 窗口关闭时保存
        newWindow.on('close', saveBounds);
        
        newWindow.loadURL(url);
    }



    copyUrl = () => {
        const fleetData = this.exportFleet();
        const url = `https://noro6.github.io/kc-web/?predeck=${fleetData}`;
        copyToClipboard(url);
    }



    // 从外部浏览器打开noro6，只导出舰队配置和陆航
    openNoro6External = () => {
        const fleetData = this.exportFleet();
        const url = `https://noro6.github.io/kc-web/?predeck=${fleetData}`;
        shell.openExternal(url);
    }



    // 从外部浏览器打开jervis，只导出舰队配置和陆航
    openJervisExternal = () => {
        const fleetData = this.exportFleet();
        const url = `https://jervis.vercel.app/?predeck=${fleetData}`;
        shell.openExternal(url);
    }



    render() {
        const result = this.state.result;
        const __ = i18n['poi-plugin-noro6-export-kai'].__.bind(i18n['poi-plugin-noro6-export-kai']);
        return (
            <div style={{ padding: '10px' }}>
                <div style={{ marginBottom: '20px' }}>
                    <Button 
                        intent="primary" 
                        large 
                        fill
                        onClick={this.openNewPage}
                    >
                        {__('Open Air Control Simulator')}
                    </Button>
                </div>

                <div style={{ marginBottom: '20px', display: 'flex' }}>
                    <Button 
                        large 
                        style={{ flex: 1, borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
                        onClick={this.openNoro6External}
                    >
                        {__('Open noro6')}
                    </Button>
                    <Button 
                        large 
                        style={{ flex: 1, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
                        onClick={this.openJervisExternal}
                    >
                        {__('Open Jervis')}
                    </Button>
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <Button 
                        large 
                        fill
                        onClick={this.copyUrl}
                    >
                        {__('Copy Export Link')}
                    </Button>
                </div>

                <div style={{ marginTop: '30px' }}>
                    <div style={{ marginBottom: '15px' }}>
                        <div style={{ marginBottom: '8px', fontWeight: 500 }}>{__('Airbase Area')}</div>
                        <RadioGroup
                            inline
                            onChange={(e) => this.setState({ airbaseAreaId: e.target.value })}
                            selectedValue={this.state.airbaseAreaId}
                        >
                            <Radio label={__('Event Airbase')} value="event" />
                            <Radio label={__('Central Airbase')} value="central" />
                            <Radio label={__('Southwest Airbase')} value="southwest" />
                        </RadioGroup>
                    </div>
                    
                    <div style={{ marginBottom: '15px' }}>
                        <div style={{ marginBottom: '8px', fontWeight: 500 }}>{__('Ship Data')}</div>
                        <RadioGroup
                            inline
                            onChange={(e) => {
                                this.setState({ shipExportType: e.target.value });
                                if (e.target.value === 'all') {
                                    this.exportShipsAll();
                                } else {
                                    this.exportShipsLocked();
                                }
                            }}
                            selectedValue={this.state.shipExportType}
                        >
                            <Radio label={__('Locked Only')} value="locked" />
                            <Radio label={__('Include Unlocked')} value="all" />
                        </RadioGroup>
                    </div>
                    
                    <div style={{ marginBottom: '15px' }}>
                        <div style={{ marginBottom: '8px', fontWeight: 500 }}>{__('Equipment Data')}</div>
                        <RadioGroup
                            inline
                            onChange={(e) => {
                                this.setState({ equipExportType: e.target.value });
                                if (e.target.value === 'all') {
                                    this.exportEquipsAll();
                                } else {
                                    this.exportEquipsLocked();
                                }
                            }}
                            selectedValue={this.state.equipExportType}
                        >
                            <Radio label={__('Locked Only')} value="locked" />
                            <Radio label={__('Include Unlocked')} value="all" />
                        </RadioGroup>
                    </div>
                </div>
            </div>
        )
    }
})