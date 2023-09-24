import React, { useState } from "react";
import { Modal, message } from "antd";
import Papa from "papaparse";
import { addQuestion } from "../../../api/exam";
import { useDispatch } from "react-redux";
import { showLoading, hideLoading } from "../../../redux/loaderSlice";

const UploadModal = ({ visible, onClose, examId }) => {
  const [csvFile, setCsvFile] = useState(null);
  const dispatch = useDispatch();

  const onFileChange = (event) => {
    const file = event.target.files[0];
    setCsvFile(file);
  };

  const handleUpload = async () => {
    if (csvFile) {
      try {
        const reader = new FileReader();
        reader.onload = (e) => {
          const csvData = e.target.result;
          Papa.parse(csvData, {
            complete: async (result) => {
              const questions = result.data.slice(1).map((row) => {
                return {
                  name: row[0],
                  correctOption: row[5],
                  options: {
                    A: row[1],
                    B: row[2],
                    C: row[3],
                    D: row[4],
                  },
                  exam: examId,
                };
              });

              dispatch(showLoading());
              for (const question of questions) {
                const response = await addQuestion(question);
                if (!response.success) {
                  message.error("Error adding question. Please try again.");
                  dispatch(hideLoading());
                  return;
                }
              }

              message.success("Questions added successfully");
              dispatch(hideLoading());
              onClose();
            },
          });
        };
        reader.readAsText(csvFile);
      } catch (error) {
        dispatch(hideLoading());
        message.error(error.message);
      }
    }
  };

  return (
    <Modal
      title="Upload CSV File"
      visible={visible}
      onCancel={onClose}
      footer={[
        <button
          key="cancel"
          className="primary-outlined-btn"
          onClick={onClose}
        >
          Cancel
        </button>,
        <button
          key="upload"
          className="primary-contained-btn"
          onClick={handleUpload}
          disabled={!csvFile}
        >
          Upload and Save
        </button>,
      ]}
    >
      <div>
        <input type="file" accept=".csv" onChange={onFileChange} />
      </div>
    </Modal>
  );
};

export default UploadModal;
