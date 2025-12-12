# 🎫 Tikeven – Event Ticket Booking Platform

Tikeven is a modern event ticket booking platform built with **Next.js 16**, allowing users to browse events, view details, filter by category or date, book tickets, and receive a unique **QR / Barcode**.  
Organizers and admins have full control over event creation, venues, capacity, bookings, and analytics.

---

## 📽️ Application Demo

> Make sure to upload your GIFs inside:  
> `public/gifs/`

### 🔹 Overview
![Overview](./public/gifs/overview.gif)

### 🔹 Create Account
![Create Account](./public/gifs/createaccount.gif)

### 🔹 Book Ticket
![Book Ticket](./public/gifs/bookticket.gif)

### 🔹 Organizer Creates Event
![Organizer Creates Event](./public/gifs/organizerevent.gif)

### 🔹 Admin Dashboard
![Admin Dashboard](./public/gifs/adminpage.gif)

---

## 🚀 Features

### 🧑‍🤝‍🧑 User Features
- Browse all events  
- Filter events by **category**, **date**, or **keyword search**  
- Multi-language support (via **i18next**)  
- View full event details (venue, price, organizer info)  
- Book tickets  
- Make secure payments using **Stripe**  
- Receive a unique **QR/Barcode** via email (via **Nodemailer**)  
- Access past and current bookings  
- Show barcode for event check-in  

---

### 👨‍💼 Organizer Dashboard
- Create, edit, and delete events  
- Choose venue & location (with **Leaflet Maps**)  
- Set ticket capacity and types  
- Upload images using **FilePond**  
- Manage event bookings  
- View analytics (Chart.js)  

---

### 🛡️ Admin Features
- Full access to all events  
- Manage users & organizers  
- Sales analytics dashboard  
- View & validate ticket QR codes  

---

### 🎫 Ticket & Barcode System
- Generates **unique QR codes** using the `qrcode` library  
- Sends the QR code via email using **Nodemailer**  
- Organizer scans QR at check-in  
- Secure booking verification  

---

## 🛠️ Tech Stack

### **Core**
- Next.js 16  
- React 19  
- TypeScript  
- Tailwind CSS 4  

### **State Management**
- Redux Toolkit  
- React Redux  

### **Payments**
- Stripe / Stripe Elements  

### **Authentication / Backend**
- Firebase  
- BcryptJS (password hashing if backend exists)

### **Forms**
- React Hook Form + Zod Validation  

### **Email**
- Nodemailer  

### **Maps**
- Leaflet + GeoSearch  

### **Uploads**
- FilePond + Image Preview  

### **Charts**
- Chart.js  
- React-Chartjs-2  

### **Internationalization**
- i18next  
- react-i18next  

---

## 📦 Installation

```bash
npm install
# or
yarn install
