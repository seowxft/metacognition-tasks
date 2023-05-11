import React from "react";
import DrawFix from "./DrawFix";
import * as DrawDots from "./DrawDots";
import * as DrawDotsEx from "./DrawDotsExample";
import DrawBox from "./DrawBox";
import * as DrawChoice from "./DrawChoice";
import * as DrawCorFeedback from "./DrawCorFeedback";
import style from "./style/perTaskStyle.module.css";
import * as utils from "./utils.js";
import * as staircase from "./PerStaircase.js";
import withRouter from "./withRouter.js";
import * as ConfSliderEx from "./DrawConfSliderExample.js";
import astrodude from "./img/astronaut.png";

import { DATABASE_URL } from "./config";

//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
// THIS CODES THE TUTORIAL SESSION + QUIZ FOR THE TASK
// Session includes:
// 1) Introduction to cover story
// 2) Practice on left/right box with feedback
// 3) Instructions to confidence rating
// 4) Quiz on instructions
// 5) If quiz fail once, bring to instructions on confidence, if fail twice, bring to the start of instructions

class PerTut extends React.Component {
  //////////////////////////////////////////////////////////////////////////////////////////////
  // CONSTRUCTOR
  constructor(props) {
    super(props);

    var sectionTime = Math.round(performance.now());

    //when deug
    //  const userID = 100;
    //  const date = 100;
    //  const startTime = 100;
    const prolificID = this.props.state.prolificID;
    const condition = this.props.state.condition;
    const userID = this.props.state.userID;
    const date = this.props.state.date;
    const startTime = this.props.state.startTime;

    const memCorrectPer = this.props.state.memCorrectPer;
    const perCorrectPer = this.props.state.perCorrectPer; //if perception task is done, it will be filled, else zero

    var trialNumTotal = 16; //26

    //the stim position
    var pracStimPos = Array(Math.round(trialNumTotal / 2))
      .fill(1)
      .concat(Array(Math.round(trialNumTotal / 2)).fill(2));
    utils.shuffle(pracStimPos);

    //////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////
    // SET STATES
    this.state = {
      // demo paramters
      prolificID: prolificID,
      condition: condition,
      userID: userID,
      date: date,
      startTime: startTime,
      astrodude: astrodude,

      //section paramters
      sectionTime: sectionTime,
      section: "tutorial",

      // trial timings in ms
      fixTimeLag: 1000, //1000
      fbTimeLag: 500, //500
      stimTimeLag: 300, //300
      respFbTimeLag: 700, //

      //trial parameters
      trialNumTotal: trialNumTotal,
      stimPosList: pracStimPos,
      respKeyCode: [87, 79], // for left and right choice keys, currently it is W and O
      tutorialTry: 1,

      //trial by trial paramters
      trialNum: 0,
      trialTime: 0,
      fixTime: 0,
      stimTime: 0,
      stimPos: 0,
      dotDiffLeft: 0,
      dotDiffRight: 0,
      dotDiffStim1: 0,
      dotDiffStim2: 0,
      responseKey: 0,
      respTime: 0,
      respFbTime: 0,
      rewFbTime: 0,
      choice: null,
      confLevel: null,
      confTime: 0,
      confMove: null, //can only move to next trial if conf was toggled
      correct: null,
      correctMat: [], //put correct in vector, to cal perf %
      correctPer: 0,

      //dot paramters
      dotRadius: 5,

      // staircase parameters
      responseMatrix: [true, true],
      reversals: 0,
      stairDir: ["up", "up"],
      dotStair: 4.65, //in log space; this is about 104 dots which is 70 dots shown for the first one

      dotStairLeft: 0,
      dotStairRight: 0,

      //quiz paramters
      quizTry: 1,
      quizNumTotal: 4,
      quizNum: 0,
      quizPressed: null,
      quizCor: null,
      quizCorTotal: null,
      quizAns: [2, 1, 2, 3],

      // screen parameters
      instructScreen: true,
      instructNum: 1, //start from 1
      taskScreen: false,
      taskSection: null,
      debug: false,

      memCorrectPer: memCorrectPer,
      perCorrectPer: perCorrectPer,
    };

    //////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////

    /* prevents page from going down when space bar is hit .*/
    window.addEventListener("keyup", function (e) {
      if (e.keyCode === 32 && e.target === document.body) {
        e.preventDefault();
      }
    });

    //////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////

    this.handleDebugKey = this.handleDebugKey.bind(this);
    this.handleInstruct = this.handleInstruct.bind(this);
    this.handleBegin = this.handleBegin.bind(this);
    this.handleResp = this.handleResp.bind(this);
    this.handleNextResp = this.handleNextResp.bind(this);
    this.handleQuizResp = this.handleQuizResp.bind(this);
    this.instructText = this.instructText.bind(this);
    this.quizText = this.quizText.bind(this);

    //////////////////////////////////////////////////////////////////////////////////////////////
    //End constructor props
  }

  //////////////////////////////////////////////////////////////////////////////////////////////
  /// KEYBOARD HANDLES ////

  handleDebugKey(pressed) {
    var whichButton = pressed;

    if (whichButton === 10) {
      document.removeEventListener("keyup", this._handleDebugKey);
      setTimeout(
        function () {
          this.redirectToTarget();
        }.bind(this),
        0
      );
    }
  }

  _handleDebugKey = (event) => {
    var pressed;

    switch (event.keyCode) {
      case 32:
        //    this is SPACEBAR
        pressed = 10;
        this.handleDebugKey(pressed);
        break;
      default:
    }
  };

  // This handles instruction screen within the component USING KEYBOARD
  handleInstruct(keyPressed) {
    var curInstructNum = this.state.instructNum;
    var whichButton = keyPressed;

    if (whichButton === 1 && curInstructNum >= 2 && curInstructNum <= 5) {
      // from page 2 to 5, I can move back a page
      this.setState({ instructNum: curInstructNum - 1 });
    } else if (
      whichButton === 2 &&
      curInstructNum >= 1 &&
      curInstructNum <= 4
    ) {
      // from page 1 to 4, I can move forward a page
      this.setState({ instructNum: curInstructNum + 1 });
    } else if (
      whichButton === 1 &&
      curInstructNum >= 7 &&
      curInstructNum <= 9
    ) {
      // from page 7 to 10, I can move back a page
      this.setState({ instructNum: curInstructNum - 1 });
    } else if (
      whichButton === 2 &&
      curInstructNum >= 6 &&
      curInstructNum <= 8
    ) {
      // from page 6 to 9, I can move forward a page
      this.setState({ instructNum: curInstructNum + 1 });
    }
  }

  handleBegin(keyPressed) {
    var curInstructNum = this.state.instructNum;
    var whichButton = keyPressed;
    if (whichButton === 3 && curInstructNum === 5) {
      this.setState({
        trialNum: 1,
        correctMat: [], //put correct in vector, to cal perf %
        responseMatrix: [true, true],
        reversals: 0,
        stairDir: ["up", "up"],
        dotStair: 4.65,
      });
      setTimeout(
        function () {
          this.tutorBegin();
        }.bind(this),
        0
      );
    } else if (whichButton === 3 && curInstructNum === 9) {
      setTimeout(
        function () {
          this.quizBegin();
        }.bind(this),
        0
      );
    } else if (whichButton === 3 && curInstructNum === 10) {
      setTimeout(
        function () {
          this.redirectToNextTask();
        }.bind(this),
        0
      );
    }
  }

  handleResp(keyPressed, timePressed) {
    var respTime =
      timePressed -
      (this.state.trialTime + this.state.fixTime + this.state.stimTime);

    var choice;
    if (keyPressed === 1) {
      choice = "left";
    } else if (keyPressed === 2) {
      choice = "right";
    } else {
      choice = null;
      //  console.log("No response made!");
    }

    var correct;
    var response;
    // correct and response is the same thing, response is just in boolean for the responseMat
    if (this.state.dotDiffLeft > this.state.dotDiffRight && choice === "left") {
      response = true;
      correct = 1;
    } else if (
      this.state.dotDiffLeft < this.state.dotDiffRight &&
      choice === "right"
    ) {
      response = true;
      correct = 1;
    } else if (this.state.dotDiffLeft === this.state.dotDiffRight) {
      // in the odd case where the dot diff is the same...
      response = true;
      correct = 1;
    } else {
      response = false;
      correct = 0;
    }

    //  console.log("response: " + response);
    var correctMat = this.state.correctMat.concat(correct);
    var responseMatrix = this.state.responseMatrix.concat(response);
    var correctPer =
      Math.round((utils.getAvg(correctMat) + Number.EPSILON) * 100) / 100; //2 dec pl

    this.setState({
      responseKey: keyPressed,
      choice: choice,
      respTime: respTime,
      correct: correct,
      responseMatrix: responseMatrix,
      correctMat: correctMat,
      correctPer: correctPer,
    });

    setTimeout(
      function () {
        this.renderChoiceFb();
      }.bind(this),
      0
    );
  }

  handleNextResp(keyPressed, timePressed) {
    var whichButton = keyPressed;
    if (whichButton === 3) {
      var rewFbTime =
        Math.round(performance.now()) -
        [
          this.state.trialTime +
            this.state.fixTime +
            this.state.stimTime +
            this.state.respTime +
            this.state.respFbTime,
        ];

      this.setState({
        rewFbTime: rewFbTime,
      });

      document.removeEventListener("keyup", this._handleNextRespKey);
      setTimeout(
        function () {
          this.renderTutorSave();
        }.bind(this),
        0
      );
    }
  }

  handleQuizResp(keyPressed, timePressed) {
    var quizNum = this.state.quizNum;
    var whichButton = keyPressed;

    var quizTime = timePressed - this.state.trialTime;

    var quizCorTotal = this.state.quizCorTotal;
    var quizCor;

    // calculate if quiz was correct or not
    if (whichButton === this.state.quizAns[quizNum - 1]) {
      quizCorTotal = quizCorTotal + 1;
      quizCor = 1;
      this.setState({
        quizPressed: whichButton,
        quizCor: quizCor,
        quizCorTotal: quizCorTotal,
        quizTime: quizTime,
      });
    } else {
      //if was incorrect
      quizCor = 0;
      this.setState({
        quizPressed: whichButton,
        quizCor: quizCor,
        quizTime: quizTime,
      });
    }

    //  console.log("Keypress: " + whichButton);
    //  console.log("QuizTime: " + quizTime);
    //  console.log("QuizNum: " + quizNum);
    //  console.log("QuizCor: " + quizCor);
    //  console.log("QuizCorTotal: " + quizCorTotal);
    //  console.log("QuizAns: " + this.state.quizAns);
    //  console.log("quizNumTotal: " + this.state.quizNumTotal);

    setTimeout(
      function () {
        this.renderQuizSave();
      }.bind(this),
      0
    );
  }

  // handle key keyPressed
  _handleInstructKey = (event) => {
    var keyPressed;

    switch (event.keyCode) {
      case 37:
        //    this is left arrow
        keyPressed = 1;
        this.handleInstruct(keyPressed);
        break;
      case 39:
        //    this is right arrow
        keyPressed = 2;
        this.handleInstruct(keyPressed);
        break;
      default:
    }
  };

  // handle key keyPressed
  _handleBeginKey = (event) => {
    var keyPressed;

    switch (event.keyCode) {
      case 32:
        //    this is spacebar
        keyPressed = 3;
        this.handleBegin(keyPressed);
        break;
      default:
    }
  };

  // handle key keyPressed
  _handleRespKey = (event) => {
    var keyPressed;
    var timePressed;
    var leftKey = this.state.respKeyCode[0];
    var rightKey = this.state.respKeyCode[1];

    switch (event.keyCode) {
      case leftKey:
        //    this is left choice
        keyPressed = 1;
        timePressed = Math.round(performance.now());
        this.handleResp(keyPressed, timePressed);
        break;
      case rightKey:
        //    this is right choice
        keyPressed = 2;
        timePressed = Math.round(performance.now());
        this.handleResp(keyPressed, timePressed);
        break;
      default:
    }
  };

  // handle key keyPressed
  _handleNextRespKey = (event) => {
    var keyPressed;
    var timePressed;

    switch (event.keyCode) {
      case 32:
        //    this is spacebar
        keyPressed = 3;
        timePressed = Math.round(performance.now());
        this.handleNextResp(keyPressed, timePressed);
        break;
      default:
    }
  };

  handleCallbackConf(callBackValue) {
    this.setState({ confValue: callBackValue });
  }

  // handle key keyPressed
  _handleQuizKey = (event) => {
    var keyPressed;
    var timePressed;

    switch (event.keyCode) {
      case 49:
        keyPressed = 1;
        timePressed = Math.round(performance.now());
        this.handleQuizResp(keyPressed, timePressed);
        break;
      case 50:
        keyPressed = 2;
        timePressed = Math.round(performance.now());
        this.handleQuizResp(keyPressed, timePressed);
        break;
      case 51:
        keyPressed = 3;
        timePressed = Math.round(performance.now());
        this.handleQuizResp(keyPressed, timePressed);
        break;
      case 52:
        keyPressed = 4;
        timePressed = Math.round(performance.now());
        this.handleQuizResp(keyPressed, timePressed);
        break;
      default:
    }
  };

  //////////////////////////////////////////////////////////////////////////////////////////////
  /// INSTRUCTION TEXT ////

  // To ask them for the valence rating of the noises
  // before we start the task
  instructText(instructNum) {
    let text;
    let text2;
    let taskCond;

    //If fail quiz once, this brings me to instruct before confidence
    if (this.state.quizTry === 2 && this.state.quizTry === 3) {
      text2 = (
        <span>
          You scored {this.state.quizCorTotal}/{this.state.quizNumTotal} on the
          quiz. Please read the instructions carefully.
          <br />
          <br />
          Your task is to choose the battery card with the{" "}
          <strong>higher charge level, i.e., more number of white dots</strong>.
        </span>
      );
    }
    //If fail quiz more than once, this brings me to the beginning of the instruct
    else if (this.state.quizTry >= 4) {
      text = (
        <span>
          You scored {this.state.quizCorTotal}/{this.state.quizNumTotal} on the
          quiz. We will restart the tutorial. Please read the instructions
          carefully.
          <br />
          <br />
        </span>
      );

      text2 = (
        <span>
          Well done!
          <br />
          <br />
          You saw that choosing the battery card with the higher charge level,
          i.e., more number of white dots was the correct answer.
        </span>
      );
    }

    if (this.state.condition === 1) {
      taskCond = (
        <span>
          Welcome to spaceship!
          <br /> <br />
          The ship has been damaged with an asteriod hit and we are glad you are
          here to help.
          <br />
          <br />
          We have found that the spaceship is running low on power.
        </span>
      );
    } else {
      taskCond = (
        <span>
          After we settled the animals, we attempted to restart the spaceship.
          Unforunately, we have found that it is running low on power!
        </span>
      );
    }

    let instruct_text1 = (
      <div>
        <span>
          {text}
          Welcome to spaceship, engineer!
          {taskCond}
          We need you to replace the battery cards fueling the spaceship.
          However, the new battery cards have different charge levels - we need
          your assistance in selecting the ones with{" "}
          <strong>high charge</strong> for use.
          <br /> <br />
          <center>
            Use the ← and → keys to navigate the pages.
            <br />
            <br />[<strong>→</strong>]
          </center>
        </span>
        <span className={style.astro}>
          <img src={this.state.astrodude} width={280} alt="astrodude" />
        </span>
      </div>
    );

    let instruct_text2 = (
      <div>
        <span>A battery card looks like this:</span>
        <br />
        <br />
        <span>
          <center>
            <DrawDotsEx.DrawDotsEx1
              dotRadius={this.state.dotRadius}
              dotDiff={80}
            />
          </center>
        </span>
        <br />
        <span>
          The white dots indicate the charge level of the battery card. The more
          white dots on the card, the higher the charge.
          <br />
          <br />
          <center>
            [<strong>←</strong>] [<strong>→</strong>]
          </center>
        </span>
      </div>
    );

    let instruct_text3 = (
      <div>
        <span>
          As there are many new battery cards to go through, we will show you
          two cards at one time. You will have to choose the battery card which
          has <strong>the higher charge</strong>, i.e., the one with{" "}
          <strong>more white dots</strong>.
        </span>
        <br />
        <br />
        <span>
          <center>
            For instance:
            <br />
            <br />
            <DrawDotsEx.DrawDotsEx2
              dotRadius={this.state.dotRadius}
              dotDiffLeft={0}
              dotDiffRight={100}
            />
          </center>
        </span>
        <br />
        <br />
        <span>
          The battery card on the <strong>right</strong> has a higher charge
          than the battery card on the left - this is the card you should
          select.
          <br />
          <br />
          <center>
            [<strong>←</strong>] [<strong>→</strong>]
          </center>
        </span>
      </div>
    );

    let instruct_text4 = (
      <div>
        <span>
          You can select the battery card of your choice with a keypress.
          <br />
          <br />
          If the battery card on the <strong>left</strong> has more charge,{" "}
          <strong>press W</strong>.
          <br />
          If the battery card on the <strong>right</strong> has more charge,{" "}
          <strong>press O</strong>.
          <br />
          <br />
          Your selected battery card will be outlined in{" "}
          <font color="#87C1FF">
            <strong>light blue</strong>
          </font>
          . Please respond quickly and to the best of your ability - the
          spaceship&apos;s power depends on it!
          <br />
          <br />
          Let&apos;s start with a practice. In this phase we will tell you
          whether your choices are right or wrong.
          <br />
          <br />
          If you are <strong>correct</strong>, the card that you selected will
          have its outline turn{" "}
          <font color="green">
            <strong>green</strong>
          </font>
          .
          <br />
          <br />
          If you are <strong>incorrect</strong>, the box that you selected will
          have its outline turn{" "}
          <font color="red">
            <strong>red</strong>
          </font>
          .
          <br />
          <br />
          <center>
            [<strong>←</strong>] [<strong>→</strong>]
          </center>
        </span>
      </div>
    );

    let instruct_text5 = (
      <div>
        <span>
          You will have {this.state.trialNumTotal} chances to choose the battery
          card with the higher charge.
          <br />
          <br />
          For every choice, you will be presented with a white cross in the
          middle of the screen first before the battery cards appear. Please pay
          attention closely as the charge level indicator (white dots) of the
          battery cards will be <strong>flashed quickly only once</strong>. Make
          your selection{" "}
          <strong>after the charge level indicator disappears</strong>
          .
          <br />
          <br />
          As a reminder:
          <br />
          <br />
          <strong>Press W</strong> to choose the battery on the{" "}
          <strong>left</strong>.
          <br />
          <strong>Press O</strong> to choose the battery on the{" "}
          <strong>right</strong>.
          <br />
          <br />
          <center>
            Press [<strong>SPACEBAR</strong>] to begin the practice.
          </center>
          <br />
          <center>
            [<strong>←</strong>]
          </center>
        </span>
      </div>
    );

    let instruct_text6 = (
      <div>
        <span>
          {text2}
          <br />
          <br />
          During the main task, you will also have to indicate your{" "}
          <strong>confidence</strong> in your choice of the battery card you
          pick.
          <br />
          <br />
          After every choice, we will show you a rating scale to rate the{" "}
          <strong>probability that your choice was correct</strong>:
          <br />
          <br />
          <br />
          <br />
          <center>
            <ConfSliderEx.ConfSliderEx1
              callBackValue={this.handleCallbackConf.bind(this)}
              initialValue={68}
            />
          </center>
          <br />
          <br />
          <br />
          <center>
            Use the ← and → keys to navigate the pages.
            <br />
            <br />[<strong>→</strong>]
          </center>
        </span>
      </div>
    );

    let instruct_text7 = (
      <div>
        If you are <strong>very unsure</strong> that you made a correct
        judgement, you should select a 50% chance of being correct, or the{" "}
        <strong>left</strong> end of the scale. It means that your choice was a
        complete guess.
        <br />
        <br />
        <br />
        <br />
        <center>
          <ConfSliderEx.ConfSliderEx1
            callBackValue={this.handleCallbackConf.bind(this)}
            initialValue={50}
          />
        </center>
        <br />
        <br />
        <br />
        If you are <strong>very sure</strong> that you made a correct judgement,
        you should select a 100% chance of being correct, or the{" "}
        <strong>right</strong> end of the scale. It means that you are
        absolutely certain that your choice was correct.
        <br />
        <br />
        <br />
        <br />
        <center>
          <ConfSliderEx.ConfSliderEx1
            callBackValue={this.handleCallbackConf.bind(this)}
            initialValue={100}
          />
        </center>
        <br />
        <br />
        <br />
        <br />
        <center>
          [<strong>←</strong>] [<strong>→</strong>]
        </center>
      </div>
    );

    let instruct_text8 = (
      <div>
        If you are <strong>somewhat sure</strong> that you made a correct
        judgement, you should select a rating between the two ends of the scale.
        <br />
        <br />
        <br />
        <br />
        <center>
          <ConfSliderEx.ConfSliderEx1
            callBackValue={this.handleCallbackConf.bind(this)}
            initialValue={75}
          />
        </center>
        <br />
        <br />
        <br />
        <br />
        You can use the slider by <strong>clicking any point</strong> along the
        scale, or <strong>dragging the circle indicator</strong> along the
        scale.
        <br />
        <br />
        Alternatively, you can press [<strong>TAB</strong>] and use the{" "}
        <strong>arrow</strong> keys to move the circle indicator.
        <br />
        <br />
        During the main task, once you have selected your rating, you will have
        to press the [<strong>SPACEBAR</strong>] to confirm it and move on to
        the next set of battery cards.
        <br />
        <br />
        <center>
          [<strong>←</strong>] [<strong>→</strong>]
        </center>
      </div>
    );

    let instruct_text9 = (
      <div>
        Before you begin, you have to pass a quick quiz to make sure that you
        have understood the key points of your task for today.
        <br />
        <br />
        Note: You will have to get <strong>all</strong> quiz questions correct.
        If not, you will be sent back to the instructions and will have to
        retake the quiz!
        <br />
        <br />
        If you fail too many times, you will be brought to the beginning of the
        entire tutorial.
        <br />
        <br />
        <center>
          Press [<strong>SPACEBAR</strong>] to begin the quiz.
        </center>
        <br />
        <center>
          [<strong>←</strong>]
        </center>
      </div>
    );

    let instruct_text10 = (
      <div>
        Amazing! You scored {this.state.quizCorTotal}/{this.state.quizNumTotal}{" "}
        for the quiz.
        <br />
        <br />
        You are ready to start the main task.
        <br />
        <br />
        <center>
          Press [<strong>SPACEBAR</strong>] to begin.
        </center>
      </div>
    );

    switch (instructNum) {
      case 1:
        return <div>{instruct_text1}</div>;
      case 2:
        return <div>{instruct_text2}</div>;
      case 3:
        return <div>{instruct_text3}</div>;
      case 4:
        return <div>{instruct_text4}</div>;
      case 5:
        return <div>{instruct_text5}</div>;
      case 6:
        return <div>{instruct_text6}</div>;
      case 7:
        return <div>{instruct_text7}</div>;
      case 8:
        return <div>{instruct_text8}</div>;
      case 9:
        return <div>{instruct_text9}</div>;
      case 10:
        return <div>{instruct_text10}</div>;
      default:
    }
  }

  //////////////////////////////////////////////////////////////////////////////////////////////
  /// QUIZ TEXT ////
  // Do I need to randomise this?

  quizText(quizNum) {
    let quiz_text1 = (
      <div>
        <strong>Q{this.state.quizNum}:</strong> You are shown two battery cards
        to inspect. What do you do?
        <br />
        <br />
        [1] - I choose the battery card with the lower number of dots.
        <br />
        [2] - I choose the battery card with the higher number of dots.
        <br />
        [3] - I choose both battery cards when they have same number of dots.
        <br />
        [4] - I am unsure.
      </div>
    );

    let quiz_text2 = (
      <div>
        <strong>Q{this.state.quizNum}:</strong> You have made your choice on the
        battery card with the higher charge. However, you are{" "}
        <strong>very unsure</strong> about your choice. How would you rate your
        confidence on the rating scale?
        <br />
        <br />
        [1] - I would pick the left end of the scale (50% correct).
        <br />
        [2] - I would pick the right end of the scale (100% correct).
        <br />
        [3] - I would pick somwhere in between the ends of the scale.
        <br />
        [4] - I am unsure.
      </div>
    );

    let quiz_text3 = (
      <div>
        <strong>Q{this.state.quizNum}:</strong> On the next set of battery
        cards, you are <strong>very sure</strong> about your choice. How would
        you rate your confidence on the rating scale?
        <br />
        <br />
        [1] - I would pick the left end of the scale (50% correct).
        <br />
        [2] - I would pick the right end of the scale (100% correct).
        <br />
        [3] - I would pick somwhere in between the ends of the scale.
        <br />
        [4] - I am unsure.
      </div>
    );

    let quiz_text4 = (
      <div>
        <strong>Q{this.state.quizNum}:</strong> On the next set of battery
        cards, you are <strong>somewhat sure</strong> about your choice. How
        would you rate your confidence on the rating scale?
        <br />
        <br />
        [1] - I would pick the left end of the scale (50% correct).
        <br />
        [2] - I would pick the right end of the scale (100% correct).
        <br />
        [3] - I would pick somwhere in between the ends of the scale.
        <br />
        [4] - I am unsure.
      </div>
    );

    switch (quizNum) {
      case 1:
        return <div>{quiz_text1}</div>;
      case 2:
        return <div>{quiz_text2}</div>;
      case 3:
        return <div>{quiz_text3}</div>;
      case 4:
        return <div>{quiz_text4}</div>;
      default:
    }
  }

  //////////////////////////////////////////////////////////////////////////////////////////////
  /// TASK TOGGLES ////

  tutorBegin() {
    // remove access to left/right/space keys for the instructions
    document.removeEventListener("keyup", this._handleInstructKey);
    document.removeEventListener("keyup", this._handleBeginKey);
    //reset tutorial if need to do again
    this.setState({
      trialNum: 0,
      responseMatrix: [true, true],
      reversals: 0,
      stairDir: ["up", "up"],
      dotStair: 4.65, //in log space; this is about 104 dots which is 70 dots shown for the first one});
      // push to render fixation for the first trial
    });
    setTimeout(
      function () {
        this.trialReset();
      }.bind(this),
      0
    );
  }

  tutorEnd() {
    // change state to make sure the screen is changed for the task
    this.setState({
      instructScreen: true,
      taskScreen: false,
      instructNum: 6,
      taskSection: null,
    });
  }

  quizBegin() {
    // remove access to left/right/space keys for the instructions
    document.removeEventListener("keyup", this._handleInstructKey);
    document.removeEventListener("keyup", this._handleBeginKey);
    document.addEventListener("keyup", this._handleQuizKey);

    // If I want to shuffle quiz answers?

    this.setState({
      instructScreen: false,
      taskScreen: true,
      taskSection: "quiz",
      quizPressed: null,
      quizNum: 1,
      quizCorTotal: 0,
      quizCor: null,
    });
  }

  quizReset() {
    var quizNum = this.state.quizNum;
    var quizCorTotal = this.state.quizCorTotal;
    var trialTime = Math.round(performance.now());

    if (quizNum < this.state.quizNumTotal) {
      //go to next quiz qn
      this.setState({
        quizNum: quizNum + 1,
        trialTime: trialTime,
      });
    } else if (quizNum === this.state.quizNumTotal) {
      document.removeEventListener("keyup", this._handleQuizKey);
      //end quiz, head back to instructions
      var quizTry = this.state.quizTry;
      var tutorialTry = this.state.tutorialTry;
      //if full marks
      if (quizCorTotal === this.state.quizNumTotal) {
        //  console.log("PASS QUIZ");
        this.setState({
          instructScreen: true,
          taskScreen: false,
          instructNum: 10,
          taskSection: "instruct",
        });
      } else if (quizCorTotal !== this.state.quizNumTotal && quizTry < 4) {
        //if they got one wrong
        //  console.log("FAIL QUIZ");
        quizTry = quizTry + 1;

        this.setState({
          instructScreen: true,
          taskScreen: false,
          instructNum: 6,
          taskSection: "instruct",
          quizTry: quizTry,
        });
      } else {
        //if they got more than one wrong
        tutorialTry = tutorialTry + 1;
        //  console.log("FAIL QUIZ");
        quizTry = quizTry + 1;
        this.setState({
          instructScreen: true,
          taskScreen: false,
          instructNum: 1,
          taskSection: "instruct",
          quizTry: quizTry,
          tutorialTry: tutorialTry,
        });
      }
    }
  }

  //////////////////////////////////////////////////////////////////////////////////
  // FOUR COMPONENTS OF THE TASK, Fixation, Stimulus/Response, Feedback and Confidence
  trialReset() {
    var trialNum = this.state.trialNum + 1; //trialNum is 0, so it starts from 1
    var stimPos = this.state.stimPosList[trialNum - 1]; //shuffle the order for the dotDiffLeft

    // run staircase
    var s2 = staircase.staircase(
      this.state.dotStair,
      this.state.responseMatrix,
      this.state.stairDir,
      trialNum
    );

    var dotStair = s2.diff;
    var stairDir = s2.direction;
    var responseMatrix = s2.stepcount;

    //  console.log("dotsStair: " + dotStair);
    //  console.log("stairDir: " + stairDir);
    //  console.log("responseMat: " + responseMatrix);

    var reversals;
    if (s2.reversal) {
      // Check for reversal. If true, add one to reversals variable
      reversals = 1;
    } else {
      reversals = 0;
    }

    var dotDiffLeft;
    var dotDiffRight;
    var dotStairLeft;
    var dotStairRight;

    if (stimPos === 1) {
      dotStairLeft = dotStair;
      dotStairRight = 0;
      dotDiffLeft = Math.round(Math.exp(dotStairLeft));
      dotDiffRight = dotStairRight; //should be 0
    } else {
      dotStairLeft = 0;
      dotStairRight = dotStair;
      dotDiffLeft = dotStairLeft; //should be 0
      dotDiffRight = Math.round(Math.exp(dotStairRight));
    }

    //Reset all parameters
    this.setState({
      instructScreen: false,
      taskScreen: true,
      taskSection: "iti",
      trialNum: trialNum,
      fixTime: 0,
      stimTime: 0,
      responseKey: 0,
      respTime: 0,
      respFbTime: 0,
      rewFbTime: 0,
      confLevel: null,
      confTime: 0,
      confMove: false,
      choice: null,
      correct: null,
      correctPer: null,
      stimPos: stimPos,
      reversals: reversals,
      responseMatrix: responseMatrix,
      stairDir: stairDir,
      //Calculate the for the paramters for the stim
      dotDiffStim1: Math.round(Math.exp(dotStair)),
      dotDiffStim2: 0,
      dotStair: dotStair,

      dotStairLeft: dotStairLeft,
      dotStairRight: dotStairRight,
      dotDiffLeft: dotDiffLeft,
      dotDiffRight: dotDiffRight,
    });

    //  console.log(this.state.trialNum);
    //  console.log(this.state.trialNumTotal);

    if (trialNum < this.state.trialNumTotal + 1) {
      setTimeout(
        function () {
          this.renderFix();
        }.bind(this),
        0
      );
    } else {
      // if the trials have reached the total trial number
      setTimeout(
        function () {
          this.tutorEnd();
        }.bind(this),
        0
      );
    }
  }

  renderFix() {
    var trialTime = Math.round(performance.now());

    //Show fixation
    this.setState({
      instructScreen: false,
      taskScreen: true,
      taskSection: "fixation",
      trialTime: trialTime,
    });

    setTimeout(
      function () {
        this.renderStim();
      }.bind(this),
      this.state.fixTimeLag
    );
  }

  //////////////////////////////////////////////////////////////////////////////////////////////
  renderStim() {
    var fixTime = Math.round(performance.now()) - this.state.trialTime;

    this.setState({
      instructScreen: false,
      taskScreen: true,
      taskSection: "stimulus",
      fixTime: fixTime,
    });

    setTimeout(
      function () {
        this.renderChoice();
      }.bind(this),
      this.state.stimTimeLag
    );
  }

  //////////////////////////////////////////////////////////////////////////////////////////////
  renderChoice() {
    document.addEventListener("keyup", this._handleRespKey);
    var stimTime =
      Math.round(performance.now()) -
      [this.state.trialTime + this.state.fixTime];

    this.setState({
      instructScreen: false,
      taskScreen: true,
      taskSection: "choice",
      stimTime: stimTime,
    });
  }

  //////////////////////////////////////////////////////////////////////////////////////////////
  renderChoiceFb() {
    document.removeEventListener("keyup", this._handleRespKey);

    this.setState({
      instructScreen: false,
      taskScreen: true,
      taskSection: "choiceFeedback",
    });

    setTimeout(
      function () {
        this.renderCorFb();
      }.bind(this),
      this.state.respFbTimeLag
    );
  }

  //////////////////////////////////////////////////////////////////////////////////////////////
  renderCorFb() {
    document.addEventListener("keyup", this._handleNextRespKey);

    var respFbTime =
      Math.round(performance.now()) -
      [
        this.state.trialTime +
          this.state.fixTime +
          this.state.stimTime +
          this.state.respTime,
      ];

    this.setState({
      instructScreen: false,
      taskScreen: true,
      taskSection: "corFeedback",
      respFbTime: respFbTime,
    });
  }

  renderTutorSave() {
    var userID = this.state.userID;

    let saveString = {
      userID: this.state.userID,
      date: this.state.date,
      startTime: this.state.startTime,
      section: this.state.section,
      sectionTime: this.state.sectionTime,
      tutorialTry: this.state.tutorialTry,
      trialNum: this.state.trialNum,
      trialTime: this.state.trialTime,
      fixTime: this.state.fixTime,
      stimTime: this.state.stimTime,
      stimPos: this.state.stimPos,
      dotDiffLeft: this.state.dotDiffLeft,
      dotDiffRight: this.state.dotDiffRight,
      dotDiffStim1: this.state.dotDiffStim1,
      dotDiffStim2: this.state.dotDiffStim2,
      responseKey: this.state.responseKey,
      respTime: this.state.respTime,
      respFbTime: this.state.respFbTime,
      rewFbTime: this.state.rewFbTime,
      choice: this.state.choice,
      confLevel: this.state.confLevel,
      confTime: this.state.confTime,
      correct: this.state.correct,
      correctMat: this.state.correctMat,
      correctPer: this.state.correctPer,

      // staircase parameters
      responseMatrix: this.state.responseMatrix,
      reversals: this.state.reversals,
      stairDir: this.state.stairDir,
      dotStair: this.state.dotStair,

      dotStairLeft: this.state.dotStairLeft,
      dotStairRight: this.state.dotStairRight,
    };

    try {
      fetch(`${DATABASE_URL}/per_tutorial_data/` + userID, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(saveString),
      });
    } catch (e) {
      console.log("Cant post?");
    }

    setTimeout(
      function () {
        this.trialReset();
      }.bind(this),
      10
    );
  }

  renderQuizSave() {
    var prolificID = this.state.prolificID;

    let saveString = {
      prolificID: this.state.prolificID,
      condition: this.state.condition,
      userID: this.state.userID,
      date: this.state.date,
      startTime: this.state.startTime,
      section: this.state.section,
      sectionTime: this.state.sectionTime,
      //quiz paramters
      quizTry: this.state.quizTry,
      quizNumTotal: this.state.quizNumTotal,
      quizNum: this.state.quizNum,
      quizTime: this.state.trialTime,
      quizResp: this.state.quizPressed,
      quizRT: this.state.quizTime,
      quizAns: this.state.quizAns,
      quizCor: this.state.quizCor,
      quizCorTotal: this.state.quizCorTotal,
    };

    try {
      fetch(`${DATABASE_URL}/quiz_test/` + prolificID, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(saveString),
      });
    } catch (e) {
      console.log("Cant post?");
    }

    setTimeout(
      function () {
        this.quizReset();
      }.bind(this),
      10
    );
  }

  redirectToNextTask() {
    document.removeEventListener("keyup", this._handleInstructKey);
    document.removeEventListener("keyup", this._handleBeginKey);
    this.props.navigate("/PerTask?PROLIFIC_PID=" + this.state.prolificID, {
      state: {
        prolificID: this.state.prolificID,
        condition: this.state.condition,
        userID: this.state.userID,
        date: this.state.date,
        startTime: this.state.startTime,
        dotStair: this.state.dotStair,
        memCorrectPer: this.state.memCorrectPer,
        perCorrectPer: this.state.perCorrectPer,
      },
    });

    //  console.log("UserID: " + this.state.userID);
  }

  componentDidMount() {
    window.scrollTo(0, 0);
    document.body.style.overflow = "hidden";
  }

  ///////////////////////////////////////////////////////////////
  render() {
    let text;
    if (this.state.debug === false) {
      if (
        this.state.instructScreen === true &&
        this.state.taskScreen === false
      ) {
        document.addEventListener("keyup", this._handleInstructKey);
        document.addEventListener("keyup", this._handleBeginKey);
        text = <div> {this.instructText(this.state.instructNum)}</div>;
        console.log("THIS SHOULD BE INSTRUCTION BLOCK");
        console.log(this.state.instructNum);
      } else if (
        this.state.instructScreen === false &&
        this.state.taskScreen === true &&
        this.state.taskSection === "iti"
      ) {
        text = <div className={style.boxStyle}></div>;
      } else if (
        this.state.instructScreen === false &&
        this.state.taskScreen === true &&
        this.state.taskSection === "fixation"
      ) {
        text = (
          <div className={style.boxStyle}>
            <DrawFix />
          </div>
        );
      } else if (
        this.state.instructScreen === false &&
        this.state.taskScreen === true &&
        this.state.taskSection === "stimulus"
      ) {
        text = (
          <div className={style.boxStyle}>
            <DrawDots.DrawDots
              dotRadius={this.state.dotRadius}
              dotDiffLeft={this.state.dotDiffLeft}
              dotDiffRight={this.state.dotDiffRight}
            />
          </div>
        );
      } else if (
        this.state.instructScreen === false &&
        this.state.taskScreen === true &&
        this.state.taskSection === "choice"
      ) {
        text = (
          <div className={style.boxStyle}>
            <DrawBox />
          </div>
        );
      } else if (
        this.state.instructScreen === false &&
        this.state.taskScreen === true &&
        this.state.taskSection === "choiceFeedback"
      ) {
        text = (
          <div className={style.boxStyle}>
            <DrawChoice.DrawChoice choice={this.state.choice} />
          </div>
        );
      } else if (
        this.state.instructScreen === false &&
        this.state.taskScreen === true &&
        this.state.taskSection === "corFeedback"
      ) {
        text = (
          <div className={style.boxStyle}>
            <DrawCorFeedback.DrawFeedback
              choice={this.state.choice}
              correct={this.state.correct}
            />
          </div>
        );
      } else if (
        this.state.instructScreen === false &&
        this.state.taskScreen === true &&
        this.state.taskSection === "quiz"
      ) {
        text = (
          <div>
            {this.quizText(this.state.quizNum)}
            <br />
            <br />
            <center>Please use the top row number keys to respond.</center>
          </div>
        );
      }
    } else if (this.state.debug === true) {
      document.addEventListener("keyup", this._handleDebugKey);
      text = (
        <div>
          <p>
            <span>DEBUG MODE</span>
            <br />
            <span>
              Press [<strong>SPACEBAR</strong>] to skip to next section.
            </span>
          </p>
        </div>
      );
    }

    return (
      <div className={style.bg}>
        <div className={style.textFrame}>
          <div className={style.fontStyle}>{text}</div>
        </div>
      </div>
    );
  }
}

//      If I want to disable mouse events to force them to use the keyboard <div style={{ pointerEvents: "none" }}>

export default withRouter(PerTut);
