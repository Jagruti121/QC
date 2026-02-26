import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph, TextRun, AlignmentType, Table, TableRow, TableCell, WidthType, ImageRun, PageBreak } from 'docx';
import headerImage from '../assets/images/Screenshot_26-2-2026_211927_tsdcmumbai.in.jpeg';

const buildDoorPasting = (roomNo, stds, headerBg) => {
  const elements = [];
  if (headerBg) {
    elements.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      children: [
        new ImageRun({
          data: headerBg,
          transformation: { width: 550, height: 110 },
        })
      ]
    }));
  }

  const firstStd = stds[0] || {};
  const dept = firstStd['DEPARTMENT'] || firstStd['DEPT'] || 'N/A';
  const year = firstStd['YEAR'] || 'N/A';
  const div = firstStd['DIVISION'] || firstStd['DIV'] || 'N/A';

  elements.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 400 },
    children: [new TextRun({ text: `Room No : ${roomNo}`, bold: true, size: 36 })]
  }));

  elements.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 400 },
    children: [
      new TextRun({ text: `Department : ${dept}        Year : ${year}        Division : ${div}`, bold: true, size: 28 })
    ]
  }));

  elements.push(new Paragraph({
    spacing: { after: 200 },
    children: [new TextRun({ text: "Seat Numbers :", bold: true, size: 24 })]
  }));

  const rows = [];
  for (let i = 0; i < stds.length; i += 4) {
    const rowCells = [];
    for (let j = 0; j < 4; j++) {
      const std = stds[i + j];
      rowCells.push(new TableCell({
        width: { size: 25, type: WidthType.PERCENTAGE },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 150, after: 150 },
            children: std ? [new TextRun({ text: `${std['ROLL NO'] || std['ROLL'] || ''}`, bold: true, size: 24 })] : []
          })
        ]
      }));
    }
    rows.push(new TableRow({ children: rowCells }));
  }

  elements.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows
  }));

  return elements;
};
import {
  Upload, Calendar, RefreshCw, Download, UserCheck, FileSpreadsheet,
  Loader, Save, ArrowLeft, Clock, LayoutTemplate, Play, Trash2, AlertTriangle, X, ShieldAlert, ChevronLeft, ChevronRight, CheckSquare, Square, Search, Filter
} from 'lucide-react';
import {
  saveAllocationTemplate,
  subscribeToTemplates,
  deleteTemplate,
  saveAllocationHistory,
  subscribeToHistory,
  getAllExamAllocations,
  deleteAllocationBatch,
  clearAllAllocations,
  getAllocationTemplates,
  getAllocationHistory,
  addBufferStudentToAllocation
} from '../utils/db';
import { collection, getDocs, writeBatch, doc, query, where } from 'firebase/firestore';
import { db } from '../firebase';

const ExamAllocation = () => {
  const [view, setView] = useState('dashboard');
  const [templates, setTemplates] = useState([]);
  const [history, setHistory] = useState([]);
  const [selectedBatches, setSelectedBatches] = useState([]);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState({
    date: true, dept: true, rollNo: true, time: true, roomNo: true
  });
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  const [students, setStudents] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [faculty, setFaculty] = useState([]);

  const [selectedDates, setSelectedDates] = useState([]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [startTime, setStartTime] = useState({ hour: '09', minute: '00', period: 'AM' });
  const [endTime, setEndTime] = useState({ hour: '12', minute: '00', period: 'PM' });

  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const [fileNames, setFileNames] = useState({ students: '', rooms: '', faculty: '' });
  const [allocations, setAllocations] = useState([]);
  const [reserveFaculty, setReserveFaculty] = useState([]);

  // Buffer Student State
  const [showBufferModal, setShowBufferModal] = useState(false);
  const [bufferRoomIndex, setBufferRoomIndex] = useState(null);
  const [bufferStudent, setBufferStudent] = useState({ rollNo: '', name: '', department: '', year: '', division: '' });

  // Dashboard Buffer State
  const [showDashBufferModal, setShowDashBufferModal] = useState(false);
  const [dashBufferData, setDashBufferData] = useState(null);
  const [dashBufferSelectedDates, setDashBufferSelectedDates] = useState([]);
  const [dashBufferSelectedRoom, setDashBufferSelectedRoom] = useState("");
  const [dashBufferStudent, setDashBufferStudent] = useState({ rollNo: '', name: '', department: '', year: '', division: '' });

  useEffect(() => {
    if (typeof subscribeToTemplates === 'function') {
      const unsubTemplates = subscribeToTemplates((data) => setTemplates(data));
      const unsubHistory = subscribeToHistory((data) => setHistory(data));
      return () => { unsubTemplates(); unsubHistory(); };
    } else {
      getAllocationTemplates().then(setTemplates);
      getAllocationHistory().then(setHistory);
    }
  }, []);

  const toggleBatchSelection = (e, batchId) => {
    e.stopPropagation();
    setSelectedBatches(prev =>
      prev.includes(batchId) ? prev.filter(id => id !== batchId) : [...prev, batchId]
    );
  };

  const handleSelectAll = () => {
    if (selectedBatches.length === history.length) setSelectedBatches([]);
    else setSelectedBatches(history.map(h => h.batchId));
  };

  const handleDownloadAllReports = async () => {
    if (selectedBatches.length === 0) return alert("Please select allocations.");
    setLoading(true);
    const zip = new JSZip();
    try {
      let headerImageBlob = null;
      try {
        const res = await fetch(headerImage);
        if (res.ok) {
          headerImageBlob = await res.arrayBuffer();
        }
      } catch (err) {
        console.warn("Could not load header image for Door Pasting", err);
      }

      const allAllocations = await getAllExamAllocations();
      const filteredData = allAllocations.filter(a => selectedBatches.includes(a.batchId));
      const sortedBatchData = filteredData.sort((a, b) => parseInt(a.room) - parseInt(b.room));

      const facWB = XLSX.utils.book_new();
      const bufferFacWB = XLSX.utils.book_new();
      const processedRoomsFac = new Set();
      let hasBufferStudents = false;

      sortedBatchData.forEach(roomAlloc => {
        if (!processedRoomsFac.has(roomAlloc.room)) {
          const regulars = (roomAlloc.students || []).filter(s => !s.isBuffer);
          const buffers = (roomAlloc.students || []).filter(s => s.isBuffer);

          if (regulars.length > 0) {
            const roomRows = regulars.map(std => ({
              'Roll': std['ROLL NO'] || std['ROLL'] || '',
              'Name': std['NAME'] || '',
              'Dept': std['DEPARTMENT'] || std['DEPT'] || '',
              'Year': std['YEAR'] || '',
              'Division': std['DIVISION'] || std['DIV'] || '',
              'Sign': ''
            }));
            const roomWS = XLSX.utils.json_to_sheet(roomRows);
            XLSX.utils.book_append_sheet(facWB, roomWS, `Room ${roomAlloc.room}`);
          }

          if (buffers.length > 0) {
            hasBufferStudents = true;
            const bRoomRows = buffers.map(std => ({
              'Roll': std['ROLL NO'] || std['ROLL'] || '',
              'Name': std['NAME'] || '',
              'Dept': std['DEPARTMENT'] || std['DEPT'] || '',
              'Year': std['YEAR'] || '',
              'Division': std['DIVISION'] || std['DIV'] || '',
              'Sign': ''
            }));
            const bRoomWS = XLSX.utils.json_to_sheet(bRoomRows);
            XLSX.utils.book_append_sheet(bufferFacWB, bRoomWS, `Room ${roomAlloc.room}`);
          }

          processedRoomsFac.add(roomAlloc.room);
        }
      });
      zip.file("Faculty_Sheets.xlsx", XLSX.write(facWB, { bookType: 'xlsx', type: 'array' }));
      if (hasBufferStudents) zip.file("Buffer_Faculty_Sheets.xlsx", XLSX.write(bufferFacWB, { bookType: 'xlsx', type: 'array' }));

      const uniqueMasterRows = [];
      const uniqueBufferMasterRows = [];
      const masterCheck = new Set();
      sortedBatchData.forEach(alloc => {
        const uniqueKey = `${alloc.batchId}-${alloc.room}`;
        if (!masterCheck.has(uniqueKey)) {
          const regulars = (alloc.students || []).filter(s => !s.isBuffer);
          const buffers = (alloc.students || []).filter(s => s.isBuffer);
          const batchHistory = history.find(h => h.batchId === alloc.batchId) || { date: "" };

          const formattedDates = batchHistory.date.split(',').map(d => {
            const dateObj = new Date(d.trim());
            const day = String(dateObj.getDate()).padStart(2, '0');
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            const year = String(dateObj.getFullYear()).slice(-2);
            return `${day}-${month}-${year}`;
          }).join(", ");

          if (regulars.length > 0) {
            uniqueMasterRows.push({
              'Room no': alloc.room,
              'Department': alloc.department,
              'Year': regulars[0]?.['YEAR'] || '',
              'Division': regulars[0]?.['DIVISION'] || '',
              'Roll no From': regulars[0]?.['ROLL NO'] || '',
              'Roll no To': regulars[regulars.length - 1]?.['ROLL NO'] || '',
              'Count': regulars.length,
              'Faculty': alloc.facultyName,
              'Date': formattedDates
            });
          }

          if (buffers.length > 0) {
            uniqueBufferMasterRows.push({
              'Room no': alloc.room,
              'Department': alloc.department,
              'Year': buffers[0]?.['YEAR'] || '',
              'Division': buffers[0]?.['DIVISION'] || '',
              'Count': buffers.length,
              'Faculty': alloc.facultyName,
              'Date': formattedDates
            });
          }

          masterCheck.add(uniqueKey);
        }
      });
      const masWS = XLSX.utils.json_to_sheet(uniqueMasterRows);
      const masWB = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(masWB, masWS, "Summary");
      zip.file("Master_Summary.xlsx", XLSX.write(masWB, { bookType: 'xlsx', type: 'array' }));

      if (uniqueBufferMasterRows.length > 0) {
        const bMasWS = XLSX.utils.json_to_sheet(uniqueBufferMasterRows);
        const bMasWB = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(bMasWB, bMasWS, "Buffer Summary");
        zip.file("Buffer_Master_Summary.xlsx", XLSX.write(bMasWB, { bookType: 'xlsx', type: 'array' }));
      }

      const stickerTableRows = [];
      const bufferStickerTableRows = [];
      const stickerCheck = new Set();
      sortedBatchData.forEach((roomAlloc) => {
        if (!stickerCheck.has(roomAlloc.room)) {
          const regulars = (roomAlloc.students || []).filter(s => !s.isBuffer);
          const buffers = (roomAlloc.students || []).filter(s => s.isBuffer);

          if (regulars.length > 0) {
            stickerTableRows.push(new TableRow({
              children: [new TableCell({
                columnSpan: 4,
                children: [new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: `ROOM ${roomAlloc.room}`, bold: true, size: 24 })]
                })],
              })]
            }));
            for (let i = 0; i < regulars.length; i += 4) {
              const rowCells = [];
              for (let j = 0; j < 4; j++) {
                const std = regulars[i + j];
                rowCells.push(new TableCell({
                  width: { size: 25, type: WidthType.PERCENTAGE },
                  children: std ? [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      spacing: { before: 200, after: 200 },
                      children: [
                        new TextRun({ text: `${std['ROLL NO'] || std['ROLL'] || ''}`, size: 24, bold: true }),
                        new TextRun({ break: 1, text: `${std['DEPARTMENT'] || ''}, ${std['YEAR'] || ''}, ${std['DIVISION'] || ''}`, size: 20 }),
                      ],
                    })
                  ] : [],
                }));
              }
              stickerTableRows.push(new TableRow({ children: rowCells }));
            }
          }

          if (buffers.length > 0) {
            bufferStickerTableRows.push(new TableRow({
              children: [new TableCell({
                columnSpan: 4,
                children: [new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: `ROOM ${roomAlloc.room} [BUFFER]`, bold: true, size: 24 })]
                })],
              })]
            }));
            for (let i = 0; i < buffers.length; i += 4) {
              const rowCells = [];
              for (let j = 0; j < 4; j++) {
                const std = buffers[i + j];
                rowCells.push(new TableCell({
                  width: { size: 25, type: WidthType.PERCENTAGE },
                  children: std ? [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      spacing: { before: 200, after: 200 },
                      children: [
                        new TextRun({ text: `${std['ROLL NO'] || std['ROLL'] || ''}`, size: 24, bold: true }),
                        new TextRun({ break: 1, text: `${std['DEPARTMENT'] || ''}, ${std['YEAR'] || ''}, ${std['DIVISION'] || ''}`, size: 20 }),
                      ],
                    })
                  ] : [],
                }));
              }
              bufferStickerTableRows.push(new TableRow({ children: rowCells }));
            }
          }

          stickerCheck.add(roomAlloc.room);
        }
      });

      const doc = new Document({ sections: [{ properties: {}, children: [new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: stickerTableRows })] }] });
      const wordBlob = await Packer.toBlob(doc);
      zip.file("Stickers.docx", wordBlob);

      if (bufferStickerTableRows.length > 0) {
        const bDoc = new Document({ sections: [{ properties: {}, children: [new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: bufferStickerTableRows })] }] });
        const bWordBlob = await Packer.toBlob(bDoc);
        zip.file("Buffer_Stickers.docx", bWordBlob);
      }

      const doorPastingElements = [];
      const doorRooms = [];
      const dpStickerCheck = new Set();
      sortedBatchData.forEach((roomAlloc) => {
        if (!dpStickerCheck.has(roomAlloc.room)) {
          const allStds = roomAlloc.students || [];
          if (allStds.length > 0) {
            doorRooms.push({ roomNo: roomAlloc.room, stds: allStds });
          }
          dpStickerCheck.add(roomAlloc.room);
        }
      });

      doorRooms.forEach((data, index) => {
        const elements = buildDoorPasting(data.roomNo, data.stds, headerImageBlob);
        doorPastingElements.push(...elements);

        if (index !== doorRooms.length - 1) {
          doorPastingElements.push(new Paragraph({ children: [new PageBreak()] }));
        }
      });

      if (doorPastingElements.length > 0) {
        const dpDoc = new Document({ sections: [{ properties: {}, children: doorPastingElements }] });
        const dpWordBlob = await Packer.toBlob(dpDoc);
        zip.file("Door Pasting and Table Pasting.docx", dpWordBlob);
      }

      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `Exam_Reports.zip`);
    } catch (error) { alert("Error generating reports."); } finally { setLoading(false); }
  };

  const handleOpenRecent = async (historyItem) => {
    setLoading(true);
    setStatusMsg("Opening Allocation...");
    try {
      const q = query(collection(db, "exam_allocations"), where("batchId", "==", historyItem.batchId));
      const snapshot = await getDocs(q);
      const batchAllocations = snapshot.docs.map(doc => ({ ...doc.data() }));

      // Group by room to ensure one card per room in UI and prevent data reversion
      const roomsMap = {};
      batchAllocations.forEach(a => {
        if (!roomsMap[a.room]) {
          roomsMap[a.room] = {
            roomNo: a.room,
            roomCapacity: a.roomCapacity || 30,
            students: a.students,
            studentDept: a.department,
            assignedFaculty: { 'FULL NAME': a.facultyName, email: a.facultyEmail },
            batchId: a.batchId,
            rollRange: a.rollRange,
            date: a.date
          };
        }
      });

      const formatted = Object.values(roomsMap);

      // Recalculate reserve faculty for the swap dropdown
      const firstAlloc = batchAllocations[0];
      const existingAllocations = await getAllExamAllocations();
      const busyFacultyNames = new Set();
      const newStart = parseTimeStr(firstAlloc.startTime);
      const newEnd = parseTimeStr(firstAlloc.endTime);
      const dates = historyItem.date.split(',').map(d => d.trim());

      existingAllocations.forEach(alloc => {
        if (dates.includes(alloc.date)) {
          const allocStart = parseTimeStr(alloc.startTime);
          const allocEnd = parseTimeStr(alloc.endTime);
          if (newStart < allocEnd && newEnd > allocStart) {
            if (alloc.facultyName) busyFacultyNames.add(normalizeName(alloc.facultyName));
          }
        }
      });

      const facKey = Object.keys(faculty[0] || {}).find(k => k.toLowerCase().includes('name') || k.toLowerCase().includes('faculty'));
      const availableFaculty = faculty.filter(f => !busyFacultyNames.has(normalizeName(f[facKey] || "")));
      const assignedNames = new Set(formatted.map(a => normalizeName(a.assignedFaculty['FULL NAME'])));
      const finalReserves = availableFaculty.filter(f => !assignedNames.has(normalizeName(f[facKey] || "")));

      setAllocations(formatted);
      setReserveFaculty(finalReserves);
      setStep(2);
      setView('allocate');
    } catch (error) { alert("Error opening allocation."); } finally { setLoading(false); }
  };

  // --- DASHBOARD BUFFER FUNC ---
  const handleOpenDashBuffer = (h) => {
    setDashBufferData(h);
    setDashBufferSelectedDates([]);
    setDashBufferSelectedRoom("");
    setDashBufferStudent({ rollNo: '', name: '', department: '', year: '', division: '' });
    setShowDashBufferModal(true);
  };

  const submitDashBuffer = async () => {
    if (!dashBufferStudent.rollNo || !dashBufferStudent.name) return alert("Roll No and Name are required");
    if (!dashBufferSelectedRoom) return alert("Please select a Room");
    if (dashBufferSelectedDates.length === 0) return alert("Please select at least one Exam Date");

    setLoading(true);
    try {
      const newStudent = {
        'ROLL NO': dashBufferStudent.rollNo,
        'NAME': dashBufferStudent.name,
        'DEPARTMENT': dashBufferStudent.department,
        'YEAR': dashBufferStudent.year,
        'DIVISION': dashBufferStudent.division
      };

      await addBufferStudentToAllocation(dashBufferData.batchId, dashBufferSelectedRoom, newStudent, dashBufferSelectedDates);

      setShowDashBufferModal(false);
      alert(`Buffer student added to Room ${dashBufferSelectedRoom} for selected dates successfully!`);
    } catch (err) {
      alert("Error adding buffer student");
    } finally {
      setLoading(false);
    }
  };

  const handleStartScratch = () => {
    setStudents([]); setRooms([]); setFaculty([]);
    setFileNames({ students: '', rooms: '', faculty: '' });
    setSelectedDates([]);
    setAllocations([]); setStep(1); setView('allocate');
  };

  const handleUseTemplate = (template) => {
    setStudents(template.students || []);
    setRooms(template.rooms || []);
    setFaculty(template.faculty || []);
    setFileNames({ students: 'Loaded from Template', rooms: 'Loaded from Template', faculty: 'Loaded from Template' });
    setSelectedDates(template.selectedDates || []);
    setAllocations([]); setStep(1); setView('allocate');
  };

  const handleDeleteTemplate = async (id) => {
    if (window.confirm("Delete this template?")) await deleteTemplate(id);
  };

  const handleDeleteHistory = async (e, historyItem) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure?")) return;
    setLoading(true);
    try { await deleteAllocationBatch(historyItem.batchId, historyItem.id); } catch (error) { alert("Error: " + error.message); } finally { setLoading(false); }
  };

  const handleResetSystem = async () => {
    if (!window.confirm("⚠️ DANGER: Reset all?")) return;
    setLoading(true);
    try { await clearAllAllocations(); alert("System Reset."); } catch (error) { alert("Error: " + error.message); } finally { setLoading(false); }
  };

  const toggleDate = (dateStr) => {
    if (selectedDates.includes(dateStr)) setSelectedDates(selectedDates.filter(d => d !== dateStr));
    else setSelectedDates([...selectedDates, dateStr].sort());
  };

  const getMinutes = (t) => {
    let h = parseInt(t.hour);
    if (t.period === 'PM' && h !== 12) h += 12;
    if (t.period === 'AM' && h === 12) h = 0;
    return h * 60 + parseInt(t.minute);
  };

  const formatTimeStr = (t) => `${t.hour}:${t.minute} ${t.period}`;

  const parseTimeStr = (str) => {
    if (!str) return 0;
    const parts = str.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!parts) return 0;
    let [_, h, m, period] = parts;
    let hr = parseInt(h);
    if (period.toUpperCase() === 'PM' && hr !== 12) hr += 12;
    if (period.toUpperCase() === 'AM' && hr === 12) hr = 0;
    return hr * 60 + parseInt(m);
  };

  const normalizeName = (name) => (!name ? "" : name.toLowerCase().replace(/dr\.|mr\.|mrs\.|prof\.|asst\./g, "").replace(/[^a-z0-9]/g, ""));

  const getRollNum = (val) => {
    if (!val) return 0;
    const strVal = String(val).replace(/[^0-9]/g, '');
    const num = parseInt(strVal, 10);
    return isNaN(num) ? 0 : num;
  };

  const handleAllocate = async () => {
    if (!students.length || !rooms.length || !faculty.length) return alert("Missing Data Files.");
    if (selectedDates.length === 0) return alert("Please select at least one Exam Date.");
    if (getMinutes(startTime) >= getMinutes(endTime)) return alert("Start Time must be before End Time.");

    setLoading(true);
    setStatusMsg("Analyzing Availability...");
    const existingAllocations = await getAllExamAllocations();
    const newStart = getMinutes(startTime);
    const newEnd = getMinutes(endTime);
    const busyRoomNumbers = new Set();
    const busyFacultyNames = new Set();

    for (const date of selectedDates) {
      const dayAllocations = existingAllocations.filter(alloc => alloc.date === date);
      for (const alloc of dayAllocations) {
        const allocStart = parseTimeStr(alloc.startTime);
        const allocEnd = parseTimeStr(alloc.endTime);
        if (newStart < allocEnd && newEnd > allocStart) {
          busyRoomNumbers.add(String(alloc.room).trim());
          if (alloc.facultyName) busyFacultyNames.add(normalizeName(alloc.facultyName));
        }
      }
    }

    const roomKey = Object.keys(rooms[0] || {}).find(k => k.toLowerCase().includes('room')) || 'ROOM NO';
    const sortedAllRooms = rooms.sort((a, b) => getRollNum(a[roomKey]) - getRollNum(b[roomKey]));
    const availableRooms = sortedAllRooms.filter(r => !busyRoomNumbers.has(String(r[roomKey]).trim()));

    if (availableRooms.length === 0) {
      setLoading(false);
      alert("⚠️ POP-UP: No rooms are available for the selected dates and time slot.");
      return;
    }

    const facKey = Object.keys(faculty[0] || {}).find(k => k.toLowerCase().includes('name') || k.toLowerCase().includes('faculty'));
    const availableFaculty = faculty.filter(f => !busyFacultyNames.has(normalizeName(f[facKey] || "")));
    const totalCapacity = availableRooms.reduce((sum, r) => sum + parseInt(r['CAPACITY'] || r['capacity'] || 30), 0);

    if (totalCapacity < students.length) {
      setLoading(false);
      alert(`⚠️ CAPACITY ERROR: Rooms only have ${totalCapacity} seats for ${students.length} students.`);
      return;
    }

    setStatusMsg("Allocating...");
    let registeredUsers = [];
    try {
      const snapshot = await getDocs(collection(db, "faculties"));
      registeredUsers = snapshot.docs.map(doc => ({ ...doc.data(), cleanName: normalizeName(doc.data().name) }));
    } catch (error) { }

    setTimeout(async () => {
      const rollKey = Object.keys(students[0] || {}).find(k => k.toUpperCase().includes('ROLL') || k.toUpperCase().trim() === 'NO') || 'ROLL NO';
      const deptKey = Object.keys(students[0] || {}).find(k => k.toUpperCase().includes('DEPT') || k.toUpperCase().includes('DEPARTMENT')) || 'DEPARTMENT';
      const facDeptKey = Object.keys(faculty[0] || {}).find(k => k.toUpperCase().includes('DEPT') || k.toUpperCase().includes('DEPARTMENT')) || 'DEPARTMENT';

      const sortedStudents = [...students].sort((a, b) => getRollNum(a[rollKey]) - getRollNum(b[rollKey]));
      let studentIdx = 0;
      let tentativeAllocations = [];
      let usedFacultyIds = new Set();

      for (const room of availableRooms) {
        if (studentIdx >= sortedStudents.length) break;
        const capacity = parseInt(room['CAPACITY'] || room['capacity'] || 30);
        let roomStudents = [];
        for (let i = 0; i < capacity && studentIdx < sortedStudents.length; i++) {
          roomStudents.push(sortedStudents[studentIdx]);
          studentIdx++;
        }
        if (roomStudents.length > 0) {
          const deptCounts = {};
          roomStudents.forEach(s => { const d = s[deptKey] || 'UNKNOWN'; deptCounts[d] = (deptCounts[d] || 0) + 1; });
          const studentDept = Object.keys(deptCounts).reduce((a, b) => deptCounts[a] > deptCounts[b] ? a : b);
          tentativeAllocations.push({ roomNo: room[roomKey], roomCapacity: capacity, students: roomStudents, studentDept, assignedFaculty: null });
        }
      }

      const shuffledFaculty = [...availableFaculty].sort(() => 0.5 - Math.random());
      let finalAllocations = [];
      tentativeAllocations.forEach(alloc => {
        let assigned = shuffledFaculty.find(f => !usedFacultyIds.has(f._id) && (f[facDeptKey] || '').trim().toUpperCase() !== (alloc.studentDept || '').trim().toUpperCase());
        if (assigned) {
          usedFacultyIds.add(assigned._id);
          const facultyName = assigned[facKey] || "Unknown";
          const matchedUser = registeredUsers.find(u => u.cleanName === normalizeName(facultyName));
          alloc.assignedFaculty = { ...assigned, 'FULL NAME': facultyName, email: matchedUser ? matchedUser.email : null };
          finalAllocations.push(alloc);
        }
      });

      if (finalAllocations.length < tentativeAllocations.length) {
        setLoading(false);
        alert("⚠️ POP-UP: No faculty members from different departments are available to assign to all rooms.");
        return;
      }

      if (finalAllocations.length === 0) { setLoading(false); return; }

      const batchId = Date.now().toString();
      const dbBatch = writeBatch(db);
      selectedDates.forEach(date => {
        finalAllocations.forEach(a => {
          const newDocRef = doc(collection(db, "exam_allocations"));
          const firstRoll = getRollNum(a.students[0][rollKey]);
          const lastRoll = getRollNum(a.students[a.students.length - 1][rollKey]);
          dbBatch.set(newDocRef, {
            batchId, room: a.roomNo, facultyEmail: a.assignedFaculty?.email || null,
            facultyName: a.assignedFaculty?.['FULL NAME'] || "Unknown",
            date, startTime: formatTimeStr(startTime), endTime: formatTimeStr(endTime),
            department: a.studentDept, students: a.students, studentCount: a.students.length,
            roomCapacity: a.roomCapacity || 30,
            rollRange: `${firstRoll} - ${lastRoll}`, timestamp: new Date().toISOString()
          });
          a.roomCapacity = a.roomCapacity || 30;
          a.rollRange = `${firstRoll} - ${lastRoll}`;
          a.date = date;
          a.batchId = batchId;
        });
      });

      await dbBatch.commit();
      const totalCapacitySaved = finalAllocations.reduce((acc, a) => acc + (a.roomCapacity || 0), 0);
      saveAllocationHistory({
        batchId, date: selectedDates.join(", "), roomCount: finalAllocations.length, studentCount: students.length,
        totalCapacity: totalCapacitySaved,
        hasBuffer: false,
        department: finalAllocations[0].studentDept, rollRange: `${getRollNum(sortedStudents[0][rollKey])} - ${getRollNum(sortedStudents[sortedStudents.length - 1][rollKey])}`,
        allocatedRooms: finalAllocations.map(a => a.roomNo).join(", "),
        startTime: formatTimeStr(startTime), endTime: formatTimeStr(endTime)
      });
      setAllocations(finalAllocations);
      setReserveFaculty(shuffledFaculty.filter(f => !usedFacultyIds.has(f._id)));
      setStep(2);
      setLoading(false);
    }, 1000);
  };

  const handleSwap = async (roomIndex, facultyId) => {
    const facultyIndex = reserveFaculty.findIndex(f => f._id === facultyId);
    if (facultyIndex === -1) return;
    const newFacultyMember = reserveFaculty[facultyIndex];
    const newFacName = newFacultyMember['FULL NAME'] || newFacultyMember['FACULTY NAME'] || newFacultyMember['Name'];
    const updatedAllocations = [...allocations];
    const targetAlloc = updatedAllocations[roomIndex];
    const oldFacultyMember = targetAlloc.assignedFaculty;
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, "faculties"));
      const registeredUsers = snapshot.docs.map(doc => ({ ...doc.data(), cleanName: normalizeName(doc.data().name) }));
      const matchedUser = registeredUsers.find(u => u.cleanName === normalizeName(newFacName));
      const newEmail = matchedUser ? matchedUser.email : null;
      const dbBatch = writeBatch(db);
      const q = query(collection(db, "exam_allocations"), where("batchId", "==", targetAlloc.batchId || ""), where("room", "==", targetAlloc.roomNo));
      const allocationsSnap = await getDocs(q);
      allocationsSnap.docs.forEach((docSnap) => {
        dbBatch.update(docSnap.ref, { facultyEmail: newEmail, facultyName: newFacName, timestamp: new Date().toISOString() });
      });
      await dbBatch.commit();
      targetAlloc.assignedFaculty = { ...newFacultyMember, 'FULL NAME': newFacName, email: newEmail };
      const updatedReserves = reserveFaculty.filter(f => f._id !== facultyId);
      if (oldFacultyMember) updatedReserves.push(oldFacultyMember);
      setAllocations(updatedAllocations);
      setReserveFaculty(updatedReserves);
      alert(`Swapped.`);
    } catch (error) { alert("Error."); } finally { setLoading(false); }
  };

  const handleFileUpload = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileNames(prev => ({ ...prev, [type]: file.name }));
    const reader = new FileReader();
    reader.onload = (evt) => {
      const wb = XLSX.read(evt.target.result, { type: 'binary' });
      let allData = [];
      wb.SheetNames.forEach(sheetName => {
        const sheetData = XLSX.utils.sheet_to_json(wb.Sheets[sheetName]);
        allData = [...allData, ...sheetData.map((row, index) => {
          const newRow = { _id: `${type}_${sheetName}_${index}_${Math.random()}` };
          Object.keys(row).forEach(key => { newRow[key.trim().toUpperCase()] = row[key]; });
          return newRow;
        })];
      });
      if (type === 'students') setStudents(allData);
      else if (type === 'rooms') setRooms(allData);
      else setFaculty(allData);
    };
    reader.readAsBinaryString(file);
  };

  const handleAddBuffer = async () => {
    if (!bufferStudent.rollNo || !bufferStudent.name) return alert("Roll No and Name are required");
    setLoading(true);
    try {
      const targetAlloc = allocations[bufferRoomIndex];
      const newStudent = {
        'ROLL NO': bufferStudent.rollNo,
        'NAME': bufferStudent.name,
        'DEPARTMENT': bufferStudent.department || targetAlloc.studentDept || '',
        'YEAR': bufferStudent.year || targetAlloc.students[0]?.['YEAR'] || '',
        'DIVISION': bufferStudent.division || targetAlloc.students[0]?.['DIVISION'] || ''
      };

      await addBufferStudentToAllocation(targetAlloc.batchId, targetAlloc.roomNo, newStudent);

      const updatedAllocations = [...allocations];
      updatedAllocations[bufferRoomIndex].students.push({ ...newStudent, isBuffer: true });
      setAllocations(updatedAllocations);

      setShowBufferModal(false);
      setBufferStudent({ rollNo: '', name: '', department: '', year: '', division: '' });
      alert("Buffer student added successfully!");
    } catch (err) {
      alert("Error adding buffer student");
    } finally {
      setLoading(false);
    }
  };

  const TimeSelect = ({ value, onChange }) => (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      <select value={value.hour} onChange={e => onChange({ ...value, hour: e.target.value })} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'white', minWidth: '60px' }}>{[...Array(12).keys()].map(i => <option key={i + 1} value={String(i + 1).padStart(2, '0')}>{String(i + 1).padStart(2, '0')}</option>)}</select>
      <span>:</span>
      <select value={value.minute} onChange={e => onChange({ ...value, minute: e.target.value })} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'white', minWidth: '60px' }}>{['00', '15', '30', '45'].map(m => <option key={m} value={m}>{m}</option>)}</select>
      <select value={value.period} onChange={e => onChange({ ...value, period: e.target.value })} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'white', minWidth: '60px' }}><option value="AM">AM</option><option value="PM">PM</option></select>
    </div>
  );

  if (view === 'dashboard') {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="page-title">Exam Dashboard</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="add-btn" onClick={handleResetSystem} style={{ backgroundColor: '#dc2626' }}><ShieldAlert size={18} /> Reset</button>
            <button className="add-btn" onClick={handleStartScratch} style={{ backgroundColor: '#4F46E5' }}><RefreshCw size={18} /> New Allocation</button>
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#374151', margin: 0 }}><Clock size={20} /> Recent Allocations</h3>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', background: 'white', border: '1px solid #d1d5db', borderRadius: '8px', padding: '6px 15px', width: '300px' }}>
                  <Search size={16} color="#9ca3af" style={{ marginRight: '8px' }} />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ border: 'none', outline: 'none', width: '100%', fontSize: '14px' }}
                  />
                </div>

                <div style={{ position: 'relative' }}>
                  <button onClick={() => setShowFilterMenu(!showFilterMenu)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'white', border: '1px solid #d1d5db', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', color: '#4b5563', fontWeight: '600' }}>
                    <Filter size={16} /> Filters
                  </button>
                  {showFilterMenu && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: '5px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px', width: '150px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', zIndex: 10 }}>
                      <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#6b7280', marginBottom: '8px' }}>SEARCH BY:</div>
                      {Object.keys(activeFilters).map(key => (
                        <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', marginBottom: '6px', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={activeFilters[key]}
                            onChange={() => setActiveFilters({ ...activeFilters, [key]: !activeFilters[key] })}
                            style={{ accentColor: '#4F46E5', cursor: 'pointer' }}
                          />
                          <span style={{ textTransform: 'capitalize' }}>{key === 'rollNo' ? 'Roll No' : key === 'roomNo' ? 'Room No' : key}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <button onClick={handleDownloadAllReports} style={{ backgroundColor: '#4F46E5', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Download size={18} /> Download Zip
              </button>
              <button onClick={handleSelectAll} style={{ background: 'none', border: 'none', color: '#4F46E5', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', marginTop: '5px', textDecoration: 'underline' }}>
                {selectedBatches.length === history.length ? "Deselect All" : "Select All"}
              </button>
            </div>
          </div>

          <div style={{ maxHeight: '550px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '15px', backgroundColor: '#f9fafb' }}>
            <div style={{ display: 'grid', gap: '10px' }}>
              {history.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>No exam allocations found</div>
              ) : (
                history.filter(h => {
                  if (!searchQuery) return true;
                  const q = searchQuery.toLowerCase();

                  const deptMatch = activeFilters.dept && h.department && h.department.toLowerCase().includes(q);
                  const rrMatch = activeFilters.rollNo && h.rollRange && h.rollRange.toLowerCase().includes(q);
                  const dtMatch = activeFilters.date && h.date && h.date.toLowerCase().includes(q);
                  const rmMatch = activeFilters.roomNo && h.allocatedRooms && h.allocatedRooms.toLowerCase().includes(q);
                  const tmMatch = activeFilters.time && ((h.startTime && h.startTime.toLowerCase().includes(q)) || (h.endTime && h.endTime.toLowerCase().includes(q)));

                  return deptMatch || rrMatch || dtMatch || rmMatch || tmMatch;
                }).map(h => {
                  const allocDate = new Date(h.date.split(',')[0]);
                  const isPast = allocDate < new Date().setHours(0, 0, 0, 0);
                  return (
                    <div key={h.id} onClick={() => handleOpenRecent(h)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: '15px 20px', borderRadius: '10px', border: '1px solid #e5e7eb', cursor: 'pointer', transition: 'box-shadow 0.2s' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <h5 style={{ margin: 0, fontWeight: 'bold' }}>Allocation on {h.date}</h5>
                          {(h.startTime && h.endTime) && (
                            <span style={{ fontSize: '11px', background: '#fef3c7', color: '#b45309', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Clock size={12} /> {h.startTime} - {h.endTime}
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginTop: '5px' }}>{h.roomCount} Rooms • {h.studentCount} Students {h.totalCapacity ? ` / ${h.totalCapacity} Capacity` : ''}</span>
                        <span style={{ fontSize: '12px', color: '#4F46E5', fontWeight: '500' }}>Dept: {h.department || "N/A"} • Roll: {h.rollRange || "N/A"}</span>
                        <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>Rooms: {h.allocatedRooms || "N/A"}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        {h.hasBuffer && (
                          <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#b45309', backgroundColor: '#fef3c7', padding: '4px 10px', borderRadius: '12px' }}>
                            BUFFER
                          </span>
                        )}
                        <span style={{ fontSize: '10px', fontWeight: 'bold', color: isPast ? '#059669' : '#4F46E5', backgroundColor: isPast ? '#d1fae5' : '#eef2ff', padding: '4px 10px', borderRadius: '12px' }}>
                          {isPast ? "COMPLETED" : "ASSIGNED"}
                        </span>
                        <button onClick={(e) => handleDeleteHistory(e, h)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={18} /></button>
                        <div onClick={(e) => toggleBatchSelection(e, h.batchId)} style={{ cursor: 'pointer' }}>
                          {selectedBatches.includes(h.batchId) ? <CheckSquare color="#4F46E5" size={24} /> : <Square color="#d1d5db" size={24} />}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const facDeptKey = faculty.length > 0 ? Object.keys(faculty[0]).find(k => k.toUpperCase().includes('DEPT') || k.toUpperCase().includes('DEPARTMENT')) || 'DEPARTMENT' : 'DEPARTMENT';

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <div className="page-header">
        <button onClick={() => setView('dashboard')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><ArrowLeft size={24} /></button>
        <h2 className="page-title">Exam Room Allocation</h2>
      </div>
      {step === 1 && (
        <div className="allocation-grid">
          <div className="alloc-card">
            <h3><Upload size={24} color="#4F46E5" /> Data Sources</h3>
            {['students', 'rooms', 'faculty'].map((type) => (
              <div key={type} className="file-upload-group">
                <label className="file-upload-label">{type.toUpperCase()}</label>
                <div className="file-upload-box" onClick={() => document.getElementById(`file-${type}`).click()}>
                  <input id={`file-${type}`} type="file" accept=".xlsx" hidden onChange={(e) => handleFileUpload(e, type)} />
                  <FileSpreadsheet size={32} color={fileNames[type] ? "#059669" : "#9ca3af"} />
                  <div className="file-name-display">{fileNames[type] || "Upload .xlsx"}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="alloc-card">
            <h3><Calendar size={24} color="#4F46E5" /> Exam Schedule</h3>
            <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
              <label className="file-upload-label">Select Dates</label>
              <div onClick={() => setShowCalendar(!showCalendar)} style={{ padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white' }}>
                <span>{selectedDates.length > 0 ? selectedDates.join(", ") : "Click to select"}</span>
                <Calendar size={18} color="#64748b" />
              </div>
              {showCalendar && (
                <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 10, background: 'white', border: '1px solid #e5e7eb', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', padding: '20px', borderRadius: '12px', width: '320px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <select value={currentMonth} onChange={(e) => setCurrentMonth(parseInt(e.target.value))} style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '4px' }}>
                        {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m, i) => <option key={m} value={i}>{m}</option>)}
                      </select>
                      <select value={currentYear} onChange={(e) => setCurrentYear(parseInt(e.target.value))} style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '4px' }}>
                        {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 2 + i).map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>
                    <X size={16} style={{ cursor: 'pointer' }} onClick={() => setShowCalendar(false)} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '5px' }}>
                    {[...Array(new Date(currentYear, currentMonth + 1, 0).getDate()).keys()].map(d => {
                      const ds = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d + 1).padStart(2, '0')}`;
                      return <button key={d} onClick={() => toggleDate(ds)} style={{ padding: '8px', borderRadius: '6px', background: selectedDates.includes(ds) ? '#4F46E5' : '#f8fafc', color: selectedDates.includes(ds) ? 'white' : '#475569', cursor: 'pointer' }}>{d + 1}</button>;
                    })}
                  </div>
                  <button onClick={() => setShowCalendar(false)} style={{ width: '100%', marginTop: '15px', padding: '10px', background: '#4F46E5', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Confirm</button>
                </div>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
              <TimeSelect value={startTime} onChange={setStartTime} />
              <TimeSelect value={endTime} onChange={setEndTime} />
            </div>
            <button className="action-btn" onClick={handleAllocate} disabled={loading}>{loading ? <RefreshCw className="animate-spin" /> : <UserCheck />}{loading ? "Processing..." : "Check Availability & Allocate"}</button>
          </div>
        </div>
      )}
      {step === 2 && (
        <div>
          <div className="stats-bar" style={{ display: 'flex', justifyContent: 'space-between', background: 'white', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem' }}>
            <div><strong>Allocation Success!</strong><br /><span style={{ fontSize: '14px', color: '#6b7280' }}>Allocated {allocations.length} rooms.</span></div>
            <button onClick={() => setView('dashboard')} style={{ background: '#4F46E5', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold' }}>Dashboard</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {allocations.map((alloc, idx) => {
              const diffDeptFaculty = reserveFaculty.filter(f => (f[facDeptKey] || '').trim().toUpperCase() !== (alloc.studentDept || '').trim().toUpperCase());
              return (
                <div key={idx} style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6', marginBottom: '1rem' }}>
                    <span style={{ fontWeight: 'bold' }}>Room {alloc.roomNo}</span>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: '#6b7280', fontSize: '11px' }}>{alloc.date}</div>
                      <div style={{ color: '#4F46E5', fontSize: '12px', fontWeight: 'bold' }}>{alloc.rollRange}</div>
                    </div>
                  </div>
                  <div style={{ background: alloc.assignedFaculty ? '#EEF2FF' : '#fee2e2', color: alloc.assignedFaculty ? '#4F46E5' : '#991b1b', padding: '8px', borderRadius: '6px', textAlign: 'center', fontWeight: '600', marginBottom: '10px' }}>{alloc.assignedFaculty ? alloc.assignedFaculty['FULL NAME'] : '⚠ No Faculty'}</div>
                  <select
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', marginTop: '10px' }}
                    onChange={(e) => handleSwap(idx, e.target.value)}
                    value=""
                  >
                    <option value="" disabled>🔄 Swap Faculty</option>
                    {diffDeptFaculty.length > 0 ? diffDeptFaculty.map((f) => (
                      <option key={f._id} value={f._id}>{f['FULL NAME'] || f['FACULTY NAME'] || f['Name']} ({f[facDeptKey]})</option>
                    )) : <option disabled>No faculty available</option>}
                  </select>

                  {(() => {
                    const isFull = alloc.students.length >= (alloc.roomCapacity || 30);
                    return (
                      <button
                        onClick={() => { setBufferRoomIndex(idx); setShowBufferModal(true); }}
                        disabled={isFull}
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: `1px dashed ${isFull ? '#9ca3af' : '#4F46E5'}`, color: isFull ? '#9ca3af' : '#4F46E5', marginTop: '10px', background: isFull ? '#f3f4f6' : 'transparent', cursor: isFull ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>
                        {isFull ? `Room Full (${alloc.students.length}/${alloc.roomCapacity || 30})` : `+ Add On-Spot Buffer Student (${alloc.students.length}/${alloc.roomCapacity || 30})`}
                      </button>
                    )
                  })()}

                  {alloc.students.filter(s => s.isBuffer).length > 0 && (
                    <div style={{ marginTop: '10px', fontSize: '11px', color: '#b45309', background: '#fffbeb', padding: '6px', borderRadius: '4px' }}>
                      <strong>Buffer Students:</strong>
                      {alloc.students.filter(s => s.isBuffer).map((bs, bi) => (
                        <div key={bi} style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                          <span>{bs['NAME']} ({bs['ROLL NO']})</span>
                          <span style={{ background: '#f59e0b', color: 'white', padding: '2px 4px', borderRadius: '4px', fontSize: '9px' }}>BUFFER</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {showBufferModal && allocations[bufferRoomIndex] && (
            <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
              <div style={{ backgroundColor: 'white', width: '400px', padding: '30px', borderRadius: '24px', position: 'relative' }}>
                <button onClick={() => setShowBufferModal(false)} style={{ position: 'absolute', right: '20px', top: '20px', background: 'none', border: 'none', cursor: 'pointer' }}><X /></button>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '15px' }}>Add Buffer Student</h3>
                <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>Adding on-spot student to Room {allocations[bufferRoomIndex].roomNo}</p>

                <div style={{ display: 'grid', gap: '15px', marginBottom: '25px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>Roll Number *</label>
                      <input type="text" value={bufferStudent.rollNo} onChange={(e) => setBufferStudent({ ...bufferStudent, rollNo: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px' }} placeholder="Roll No" />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>Student Name *</label>
                      <input type="text" value={bufferStudent.name} onChange={(e) => setBufferStudent({ ...bufferStudent, name: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px' }} placeholder="Student Name" />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>Year</label>
                      <input type="text" value={bufferStudent.year} onChange={(e) => setBufferStudent({ ...bufferStudent, year: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>Division</label>
                      <input type="text" value={bufferStudent.division} onChange={(e) => setBufferStudent({ ...bufferStudent, division: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>Department</label>
                      <input type="text" value={bufferStudent.department} onChange={(e) => setBufferStudent({ ...bufferStudent, department: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px' }} placeholder="Default: Room's Dept" />
                    </div>
                  </div>
                </div>

                <button onClick={handleAddBuffer} disabled={loading} style={{ width: '100%', padding: '12px', background: '#4F46E5', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
                  {loading ? 'Adding...' : 'Save Buffer Student'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      <div style={{ marginTop: '20px', textAlign: 'center', color: '#6b7280' }}>all the best</div>

      {showDashBufferModal && dashBufferData && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', width: '450px', padding: '30px', borderRadius: '24px', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
            <button onClick={() => setShowDashBufferModal(false)} style={{ position: 'absolute', right: '20px', top: '20px', background: 'none', border: 'none', cursor: 'pointer' }}><X /></button>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '5px' }}>Add On-Spot Student</h3>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>Dept: {dashBufferData.department} | Original Dates: {dashBufferData.date}</p>

            <div style={{ display: 'grid', gap: '15px', marginBottom: '25px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>Roll Number *</label>
                  <input type="text" value={dashBufferStudent.rollNo} onChange={(e) => setDashBufferStudent({ ...dashBufferStudent, rollNo: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px' }} placeholder="Roll No" />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>Student Name *</label>
                  <input type="text" value={dashBufferStudent.name} onChange={(e) => setDashBufferStudent({ ...dashBufferStudent, name: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px' }} placeholder="Student Name" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>Year</label>
                  <input type="text" value={dashBufferStudent.year} onChange={(e) => setDashBufferStudent({ ...dashBufferStudent, year: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>Division</label>
                  <input type="text" value={dashBufferStudent.division} onChange={(e) => setDashBufferStudent({ ...dashBufferStudent, division: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>Department</label>
                  <input type="text" value={dashBufferStudent.department} onChange={(e) => setDashBufferStudent({ ...dashBufferStudent, department: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px' }} placeholder={dashBufferData.department} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>Assign to Room Number *</label>
                <select value={dashBufferSelectedRoom} onChange={(e) => setDashBufferSelectedRoom(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer' }}>
                  <option value="" disabled>Select Room...</option>
                  {dashBufferData.allocatedRooms && dashBufferData.allocatedRooms.split(',').map((r) => (
                    <option key={r.trim()} value={r.trim()}>Room {r.trim()}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>Assign for Exam Dates *</label>
                <div style={{ display: 'grid', gap: '6px', background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  {dashBufferData.date && dashBufferData.date.split(',').map(d => d.trim()).map(dt => (
                    <label key={dt} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                      <input
                        type="checkbox"
                        checked={dashBufferSelectedDates.includes(dt)}
                        onChange={() => {
                          if (dashBufferSelectedDates.includes(dt)) {
                            setDashBufferSelectedDates(dashBufferSelectedDates.filter(d => d !== dt));
                          } else {
                            setDashBufferSelectedDates([...dashBufferSelectedDates, dt]);
                          }
                        }}
                        style={{ accentColor: '#4F46E5', cursor: 'pointer' }}
                      />
                      {dt}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <button onClick={submitDashBuffer} disabled={loading} style={{ width: '100%', padding: '12px', background: '#4F46E5', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
              {loading ? 'Adding...' : 'Save Buffer Student'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamAllocation;