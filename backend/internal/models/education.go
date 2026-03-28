package models

// EducationContent represents an educational article about investing
type EducationContent struct {
	ID        string   `json:"id"`
	Title     string   `json:"title"`
	Category  string   `json:"category"`
	Level     string   `json:"level"` // "beginner", "intermediate", "advanced"
	Summary   string   `json:"summary"`
	Content   string   `json:"content"`
	KeyPoints []string `json:"keyPoints"`
	Tags      []string `json:"tags"`
	ReadTime  int      `json:"readTime"` // minutes
	Emoji     string   `json:"emoji"`
}
