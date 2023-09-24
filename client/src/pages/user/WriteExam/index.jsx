import { message } from "antd";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { getExamById } from "../../../api/exam";
import { hideLoading, showLoading } from "../../../redux/loaderSlice";
import Instructions from "./Instructions";
import { addReport } from "../../../api/reports";
import { CountdownCircleTimer } from 'react-countdown-circle-timer';


const WriteExam = () => {
  const [examsData, setExamData] = useState(null);
  const [view, setView] = useState("instructions");
  const [questions = [], setQuestions] = useState([]);
  const [selectedQuesitonIndex, setSeletedQuesitonIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [timeUp, setTimeUp] = useState(false);
  const [result, setResult] = useState({});
  const [intervalId, setIntervalId] = useState(null);
  const { user } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const params = useParams();
  const navigate = useNavigate();
  const renderTime = ({ remainingTime }) => {
    const hours = Math.floor(remainingTime / 3600);
    const minutes = Math.floor((remainingTime % 3600) / 60);
    const seconds = remainingTime % 60;
  
    return (
      <div>
        <div className="text-2xl">
          {hours}:{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>
      </div>
    );
  };
  const getExamData = async () => {
    try {
      dispatch(showLoading());
      const response = await getExamById(params.id);
      dispatch(hideLoading());
      if (response.success) {
        setExamData(response.data);
        setQuestions(response.data.questions);
        setSecondsLeft(response.data.duration);
      } else {
        message.error(response.error);
      }
    } catch (error) {
      dispatch(hideLoading());
      message.error(error.message);
    }
  };
  useEffect(() => {
    if (params.id) getExamData();
  }, []);
  const calculateResult = async () => {
    try {
      let correctAnswers = [];
      let wrongAnswers = [];
      questions.forEach((question, index) => {
        if (question.correctOption === selectedOptions[index]) {
          correctAnswers.push(question);
        } else {
          wrongAnswers.push(question);
        }
      });
      let verdict = "Pass";
      if (correctAnswers.length < examsData.passingMarks) {
        verdict = "Fail";
      }
      const tempResult = {
        correctAnswers,
        wrongAnswers,
        verdict,
      };
      setResult(tempResult);
      dispatch(showLoading());
      const response = await addReport({
        exam: params.id,
        result: tempResult,
        user: user._id,
      });
      dispatch(hideLoading());
      if (response.success) {
        setView("result");
      } else {
        message.error(response.error);
      }
    } catch (error) {
      dispatch(hideLoading());
      message.error(error.message);
    }
  };
  const startTimer = () => {
    let totalSeconds = examsData.duration;
    const intervalId = setInterval(() => {
      if (totalSeconds > 0) {
        totalSeconds = totalSeconds - 1;
        setSecondsLeft(totalSeconds);
      } else {
        clearInterval(intervalId);
        setTimeUp(true);
      }
    }, 1000);
    setIntervalId(intervalId);
  };
  
  useEffect(() => {
    if (timeUp) {
      clearInterval(intervalId);
      calculateResult();
    }
  }, [timeUp]);
  
  return (
    <div className="home">
      {examsData && <h1 className="text-center">{examsData?.name}</h1>}
      {view === "instructions" && (
        <Instructions
          examsData={examsData}
          setView={setView}
          startTimer={startTimer}
        />
      )}
      {view === "questions" && (
        <div className="question-section mx-2 justify-between gap-2">
        <div className="flex flex-col gap-5 w-75 ">
          <div className="flex justify-between">
            <h1 className="text-2xl">
              {selectedQuesitonIndex + 1}:
              {questions[selectedQuesitonIndex]?.name}
            </h1>
          </div>
          <div className="flex flex-col gap-2">
            {Object.keys(questions[selectedQuesitonIndex].options).map(
              (option, index) => {
                return (
                  <div
                    className={`flex gap-2 items-center ${
                      selectedOptions[selectedQuesitonIndex] === option
                        ? "selected-option"
                        : "option"
                    }`}
                    key={index}
                    onClick={() => {
                      setSelectedOptions({
                        ...selectedOptions,
                        [selectedQuesitonIndex]: option,
                      });
                    }}
                  >
                    <h1 className="text-xl">
                      {option}:
                      {questions[selectedQuesitonIndex].options[option]}
                    </h1>
                  </div>
                );
              }
            )}
          </div >
          <div className="mx-5 flex justify-between">
          {selectedQuesitonIndex > 0 && (
            <button
              className="primary-outlined-btn"
              onClick={() => {
                setSeletedQuesitonIndex(selectedQuesitonIndex - 1);
              }}
            >
              Previous
            </button>
          )}
          {selectedQuesitonIndex < questions.length - 1 && (
            <button
              className="primary-contained-btn"
              onClick={() => {
                setSeletedQuesitonIndex(selectedQuesitonIndex + 1);
              }}
            >
              Next
            </button>
          )}
          {selectedQuesitonIndex === questions.length - 1 && (
            <button
              className="primary-contained-btn"
              onClick={() => {
                setTimeUp(true);
                clearInterval(intervalId);
              }}
            >
              Submit
            </button>
          )}
          </div>
        </div>
        <div className="info flex-col gap-2 ">
            <div className="timer">
              <CountdownCircleTimer
              isPlaying
              duration={examsData.duration}
              colors={["#004777", "#F7B801", "#A30000", "#A30000"]}
              colorsTime={[examsData.duration, examsData.duration/3, examsData.duration/5, 0]}
              >
              {renderTime}
              </CountdownCircleTimer>
            </div>
          <div className="attempted-questions mt-1">
            {questions.map((question, index) => (
              <div
                key={index}
                className={`question-number ${
                  index === selectedQuesitonIndex ? "active" : ""
                } ${selectedOptions[index] ? "attempted" : "unattempted"}`}
                onClick={() => setSeletedQuesitonIndex(index)}
              >
                {index + 1}
              </div>
            ))}
          </div>
          <button
              className="primary-contained-btn"
              onClick={() => {
                setTimeUp(true);
                clearInterval(intervalId);
              }}
            >
              Submit
            </button>
          </div>
        </div>
      )}
      
      {view === "result" && (
        <div className="flex justify-center mt-2 result">
          <div className="flex flex-col">
          <div className="summary flex justify-between">
          <div className="attempt-summary text-xl">
            <p>Attempted: {Object.keys(selectedOptions).length}</p>
            <p>Left: {questions.length - Object.keys(selectedOptions).length}</p>
          </div>
          </div>
          </div>
        </div>
      )}
        <div className="footer">
        <p>&copy; 2023 UPMRC - Uttar Pradesh Metro Rail Corporation. All rights reserved.</p>
      </div>
    </div>
  );
};

export default WriteExam;
