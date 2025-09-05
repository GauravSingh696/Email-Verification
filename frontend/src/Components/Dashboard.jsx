// src/pages/Dashboard.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router";
import { MdDeleteForever } from "react-icons/md";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [notes, setNotes] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");

  useEffect(() => {
    const raw = window.localStorage.getItem("hd_user");
    if (!raw) {
      navigate("/signin");
      return;
    }
    const u = JSON.parse(raw);
    setUser(u);
    fetchNotes(u.id);
    // eslint-disable-next-line
  }, []);

  const fetchNotes = async (userId) => {
    try {
      const res = await axios.get(`http://localhost:8080/notes?userId=${userId}`);
      if (res.data.Success) setNotes(res.data.notes);
    } catch (err) {
      console.error(err);
    }
  };

  const createNote = async () => {
    if (!title) return alert("Enter note title");
    try {
      const res = await axios.post("http://localhost:8080/notes", {
        userId: user.id,
        title,
        content: "",
      });
      if (res.data.Success) {
        setTitle("");
        setShowCreate(false);
        fetchNotes(user.id);
      }
    } catch (err) {
      console.error(err);
      alert("Error creating note");
    }
  };

  const deleteNote = async (id) => {
    try {
      await axios.delete(`http://localhost:8080/notes/${id}`);
      fetchNotes(user.id);
    } catch (err) {
      console.error(err);
    }
  };

  const signOut = () => {
    localStorage.removeItem("hd_user");
    navigate("/signin");
  };

  if (!user) return null;

  return (
    <div className="flex h-screen justify-center items-center bg-white">
      <div className="w-md p-6 rounded-xl shadow-xl #D9D9D9">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/icon.png" alt="logo" className="w-8 h-8 animate-spin" />
            <h2 className="text-2xl font-semibold">Dashboard</h2>
          </div>
          <button onClick={signOut} className="text-blue-500 cursor-pointer">Sign Out</button>
        </div>

        <div className="mt-6 p-4 bg-white rounded-xl shadow-md max-w-xl">
          <h3 className="text-xl font-bold">Welcome, {user.name} !</h3>
          <p className="mt-2 text-gray-600">Email: {user.email}</p>
        </div>

        <div className="mt-6">
          <button onClick={() => setShowCreate(true)} className="w-full max-w-xl h-12 rounded-xl bg-blue-500 text-white cursor-pointer">Create Note</button>
        </div>

        {showCreate && (
          <div className="mt-4 max-w-xl">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Note title" className="w-full h-10 px-3 border-2 border-gray-300 rounded-xl" />
            <div className="flex gap-2 mt-2">
              <button onClick={createNote} className="bg-blue-500 text-white px-4 py-2 rounded-xl cursor-pointer">Create</button>
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-xl border cursor-pointer">Cancel</button>
            </div>
          </div>
        )}

        <h4 className="mt-8 text-lg">Notes</h4>
        <div className="mt-3 max-w-xl flex flex-col gap-3">
          {notes.map(note => (
            <div key={note.id} className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm">
              <div>{note.title}</div>
              <button onClick={() => deleteNote(note.id)} className="cursor-pointer"><MdDeleteForever className="size-7"/></button>
            </div>
          ))}
          {notes.length === 0 && <div className="text-gray-500">No notes yet</div>}
        </div>
      </div>
    </div>

  );
};

export default Dashboard;
