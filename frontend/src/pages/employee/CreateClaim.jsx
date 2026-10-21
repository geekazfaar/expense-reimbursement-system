
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

function CreateClaim({ onBack }) 
{ const token = useSelector((state) => state.auth.token);
  const [categories, setCategories] = useState([]);
  const [expenseDate, setExpenseDate] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unitPrice, setUnitPrice] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  const [receipts, setReceipts] = useState([]);


  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(
          "http://localhost:5001/api/categories",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
  
        const data = await response.json();
  
        if (!response.ok) {
          throw new Error(data.message || "Failed to load categories");
        }
  
        setCategories(data.categories);
        setMessage("");
      } catch (error) {
        setMessage(error.message);
      }
    };
  
    if (token) {
      fetchCategories();
    }
  }, [token]);
  

  const totalAmount =
    Number(quantity) * Number(unitPrice);

const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("Submitting claim...");
  
    try {
        
      
const formData = new FormData();

formData.append("category_id", categoryId);
formData.append("expense_date", expenseDate);
formData.append("quantity", Number(quantity));
formData.append("unit_price", Number(unitPrice));
formData.append("description", description);

receipts.forEach((file) => {
  formData.append("receipts", file);
});

const response = await fetch("http://localhost:5001/api/claims", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
  },
  body: formData,
});

  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.message || "Failed to submit claim");
      }
  
      setMessage("Expense claim submitted successfully!");
setTimeout(() => onBack(), 1000);
    } catch (error) {
      setMessage(
        error.message || "Unable to connect to the server"
      );
    }
  };
  

  return (
    <div style={{
        maxWidth: "600px",
        margin: "30px auto",
        padding: "24px",
        fontFamily: "Arial, sans-serif"
      }}>
      <h1 style={{
  fontSize: "28px",
  lineHeight: "1.3",
  textAlign: "center",
  marginBottom: "24px"
}}>
  Apply for Expense Reimbursement
</h1>

<form
  onSubmit={handleSubmit}
  style={{
    display: "flex",
    flexDirection: "column",
    gap: "16px"
  }}
>
        <label style={{
  display: "flex",
  flexDirection: "column",
  gap: "6px"
}}>
        
          Expense Date
          <input
            type="date"
            value={expenseDate}
            max={new Date().toLocaleDateString("en-CA")}
            onChange={(e) => setExpenseDate(e.target.value)}
            required
          />
        </label>

        <label style={{
  display: "flex",
  flexDirection: "column",
  gap: "6px"
}}>
        
          Expense Category
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            required
          >
            <option value="">Select a category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>

        <label style={{
  display: "flex",
  flexDirection: "column",
  gap: "6px"
}}>
        
          Quantity
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
          />
        </label>

        <label style={{
  display: "flex",
  flexDirection: "column",
  gap: "6px"
}}>
        
          Unit Price
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={unitPrice}
            onChange={(e) => setUnitPrice(e.target.value)}
            required
          />
        </label>

        <p>Total Amount: ₹{Number.isFinite(totalAmount) ? totalAmount.toFixed(2) : "0.00"}</p>

        <label style={{
  display: "flex",
  flexDirection: "column",
  gap: "6px"
}}>
            
          Description
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />

<div>
  <label htmlFor="receipts">Attach receipts (PDF, JPG, PNG; max 5 MB each)</label>
  <input
    id="receipts"
    type="file"
    accept=".pdf,.jpg,.jpeg,.png"
    multiple
    onChange={(e) => setReceipts(Array.from(e.target.files || []))}
  />
</div>

        </label>

        <p>{message}</p>
        <button type="submit">Submit Claim</button>

        <button type="button" onClick={onBack}>
          Back to Dashboard
        </button>
      </form>
    </div>
  );
}

export default CreateClaim;
