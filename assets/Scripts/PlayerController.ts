/**
 * @author MYXH <1735350920@qq.com>
 * @license GNU GPL v3
 * @version 0.0.1
 * @date 2025-04-17
 * @description 玩家控制器
 */

import {
    _decorator,
    Component,
    Vec3,
    input,
    Input,
    EventMouse,
    // Animation,
    SkeletalAnimation,
} from "cc";
const { ccclass, property } = _decorator;

@ccclass("PlayerController")
export class PlayerController extends Component {
    /**
     * @description 身体动画
     */
    // @property({ type: Animation })
    // public BodyAnim: Animation | null = null;

    /**
     * @description 骨骼动画
     */
    @property({ type: SkeletalAnimation })
    public CocosAnim: SkeletalAnimation | null = null;

    /**
     * @description 是否接收到跳跃指令
     */
    private _startJump: boolean = false;

    /**
     * @description 跳跃步长：一步或者两步
     */
    private _jumpStep: number = 0;

    /**
     * @description 当前跳跃时间
     */
    private _curJumpTime: number = 0;

    /**
     * @description 每次跳跃时长
     */
    private _jumpTime: number = 0.1;

    /**
     * @description 当前跳跃速度
     */
    private _curJumpSpeed: number = 0;

    /**
     * @description 角色当前位置
     */
    private _curPos: Vec3 = new Vec3();

    /**
     * @description 每次跳跃过程中，当前帧移动位置差
     */
    private _deltaPos: Vec3 = new Vec3(0, 0, 0);

    /**
     * @description 角色目标位置
     */
    private _targetPos: Vec3 = new Vec3();

    /**
     * @description 当前移动的索引
     */
    private _curMoveIndex: number = 0;

    start() {
        // input.on(Input.EventType.MOUSE_UP, this.onMouseUp, this);
    }

    /**
     * @description 设置输入是否激活
     * @param active 是否激活
     * @param inputType 输入类型
     * @returns void
     */
    setInputActive(active: boolean) {
        if (active) {
            // 添加鼠标事件监听
            input.on(Input.EventType.MOUSE_UP, this.onMouseUp, this);
        } else {
            // 移除事件监听
            input.off(Input.EventType.MOUSE_UP, this.onMouseUp, this);
        }
    }

    /**
     * @description 重置
     * @returns void
     */
    reset() {
        // 重置当前移动的索引
        this._curMoveIndex = 0;

        // 获取当前的位置
        this.node.getPosition(this._curPos);

        // 重置目标位置
        this._targetPos.set(0, 0, 0);
    }

    /**
     * @description 鼠标抬起事件
     * @param event 鼠标事件
     * @returns void
     */
    onMouseUp(event: EventMouse) {
        // 0：左键，1：中键，2：右键
        if (event.getButton() === 0) {
            this.jumpByStep(1);
        } else if (event.getButton() === 2) {
            this.jumpByStep(2);
        }
    }

    /**
     * @description 跳跃
     * @param step 跳跃的步数 1 或者 2
     * @returns void
     */
    jumpByStep(step: number) {
        if (this._startJump) {
            return;
        }

        // 表示开始跳跃
        this._startJump = true;

        // 本次跳跃的步数，一步或者两步
        this._jumpStep = step;

        // 重置下跳跃的时间
        this._curJumpTime = 0;

        // 根据步数选择动画
        const clipName = step === 1 ? "oneStep" : "twoStep";

        // 检查当前对象的 BodyAnim 属性是否存在
        /*
        if (!this.BodyAnim) {
            // 如果 BodyAnim 不存在，则直接返回，不执行后续代码
            return;
        }
        */
        if (!this.CocosAnim) {
            // 如果 CocosAnim 不存在，则直接返回，不执行后续代码
            return;
        }

        // 获取动画状态
        // const state = this.BodyAnim.getState(clipName);

        // 获取动画的时间
        // this._jumpTime = state.duration;

        // 计算跳跃的速度，根据时间计算出速度
        // this._curJumpSpeed = this._jumpStep / this._jumpTime;

        // 获取角色当前的位置
        this.node.getPosition(this._curPos);

        // 目标位置 = 当前位置 + 步长
        Vec3.add(this._targetPos, this._curPos, new Vec3(this._jumpStep, 0, 0));

        // 播放动画
        /*
        if (this.BodyAnim) {
            if (step === 1) {
                // 调用 BodyAnim 的 play 方法，播放名为 "oneStep" 的动画
                this.BodyAnim.play("oneStep");
            } else if (step === 2) {
                // 否则如果 step 等于 2
                // 调用 BodyAnim 的 play 方法，播放名为 "twoStep" 的动画
                this.BodyAnim.play("twoStep");
            }
        }
        */
        if (this.CocosAnim) {
            // 跳跃动画时间比较长，这里加速播放
            this.CocosAnim.getState("cocos_anim_jump").speed = 3.5;

            // 播放跳跃动画
            this.CocosAnim.play("cocos_anim_jump");
        }

        // 更新当前移动的索引
        this._curMoveIndex += step;
    }

    /**
     * @description 跳跃结束事件
     * @returns void
     */
    onOnceJumpEnd() {
        // 跳跃结束，播放待机动画
        if (this.CocosAnim) {
            this.CocosAnim.play("cocos_anim_idle");
        }

        // 触发跳跃结束事件
        this.node.emit("JumpEnd", this._curMoveIndex);
    }

    /**
     * @description 更新
     * @param deltaTime 时间间隔
     * @returns void
     */
    update(deltaTime: number): void {
        if (this._startJump) {
            // 处理跳跃的分支逻辑
            this._curJumpTime += deltaTime;

            if (this._curJumpTime > this._jumpTime) {
                // 跳跃结束
                // 强制位移到目标位置
                this.node.setPosition(this._targetPos);

                // 标记跳跃结束
                this._startJump = false;

                // 调用跳跃结束事件
                this.onOnceJumpEnd();
            } else {
                // 跳跃中
                // 获取当前的位置
                this.node.getPosition(this._curPos);

                // 计算本帧应该位移的长度
                this._deltaPos.x = this._curJumpSpeed * deltaTime;

                // 将当前位置加上位移的长度
                Vec3.add(this._curPos, this._curPos, this._deltaPos);

                // 设置位移后的位置
                this.node.setPosition(this._curPos);
            }
        }
    }
}
