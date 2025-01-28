
import { useParams } from "react-router-dom"
import { useEffect,useState } from "react"



const Interview: React.FC = () => {
    const { interviewId } = useParams()
    
    return(<h1>hello mamma {interviewId}</h1>)
} 

export default Interview