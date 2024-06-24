import express from 'express';
import axios from 'axios';
import pg from "pg";
import bodyParser from "body-parser";

const app=express();
const port=3000;
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "Database Name",
    password: "Your Name",
    port: 5432,
  });
db.connect();
let items=[];

async function checkBooks(){
    const result=await db.query("SELECT id,book_name, TO_CHAR(last_read, 'YYYY-MM-DD') as last_read, rating, notes,img_id FROM book");
    items=result.rows;
    return items;
}

function get_id(t){
    try{
        let arr=t.split(" ");
        let u="https://openlibrary.org/search.json?title=";
        for (var i=0;i<arr.length-1;i++){
            u=u+arr[i];
            u=u+"+";
        }
        u=u+arr[i];
        return u;
    } catch(err){
        console.error(err);
    }

}


app.get("/",async (req,res)=>{
    let bookItems=await checkBooks();
    console.log(bookItems);
    res.render("index.ejs",{
        bookItems:bookItems,
    });
});

app.get("/add",async (req,res)=>{
    res.render("create.ejs");
});

app.post("/add",async (req,res)=>{
    const name=req.body.bookName;
    const date=req.body.lastReadDate;
    const dateOnly = date.split('T')[0];
    const rating=req.body.rating;
    const content=req.body.notes;
    const temp=get_id(name);
    const result=await axios.get(temp);
    const id=result.data.docs[0].cover_i;
    await db.query("INSERT INTO book (book_name,rating,last_read,notes,img_id) VALUES ($1,$2,$3,$4,$5);",[name,rating,dateOnly,content,id]);
    res.redirect("/");
});

app.post("/sort",async (req,res)=>{
    const factor=req.body.sortby;
    console.log(factor);
    let result;
    let sorted_item=[];
    if (factor==="book_name"){
        result=await db.query("SELECT id,book_name, TO_CHAR(last_read, 'YYYY-MM-DD') as last_read, rating, notes,img_id FROM book order by book_name");
    }else if (factor==="rating"){
        result=await db.query("SELECT id,book_name, TO_CHAR(last_read, 'YYYY-MM-DD') as last_read, rating, notes,img_id FROM book order by rating desc");
    }else{
        result=await db.query("SELECT id,book_name, TO_CHAR(last_read, 'YYYY-MM-DD') as last_read, rating, notes,img_id FROM book order by last_read desc");
    }
    sorted_item=result.rows;
    res.render("index.ejs",{
        bookItems:sorted_item
    });
});

app.post("/view",async (req,res)=>{
    const book_id=req.body.viewItemId;
    console.log("id:"+book_id);
    const selected_book=await db.query("SELECT id,book_name, TO_CHAR(last_read, 'YYYY-MM-DD') as last_read, rating, notes FROM book where id=$1",[book_id]);
    let book_cont=selected_book.rows[0];
    console.log(selected_book);
    res.render("view.ejs",{
        book:book_cont
    });

});

app.post("/save",async (req,res)=>{
    const id=req.body.bookid;
    console.log(id);
    const date=req.body.lastReadDate;
    const dateOnly = date.split('T')[0];
    const rating=req.body.rating;
    const content=req.body.notes;
    await db.query("update book set last_read=$1 where id=$2",[dateOnly,id]);
    await db.query("update book set rating=$1 where id=$2",[rating,id]);
    await db.query("update book set notes=$1 where id=$2",[content,id]);
    res.redirect("/");
});

app.post("/delete",async (req,res)=>{
    const id=req.body.bookid;
    await db.query("delete from book where id=$1",[id]);
    res.redirect("/");
});

app.listen(port,()=>{
    console.log("Server is running");
});
