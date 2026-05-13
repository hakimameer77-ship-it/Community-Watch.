-- Community Watch Crime Reporting System - PostgreSQL Database Schema
-- Database: community_watch_db
-- Author: System Generated
-- Date: 2026-05-13

-- Drop existing tables if they exist
DROP TABLE IF EXISTS REPORT_RESOLUTION CASCADE;
DROP TABLE IF EXISTS AUTHORITY_ACTION CASCADE;
DROP TABLE IF EXISTS REPORT_MEDIA CASCADE;
DROP TABLE IF EXISTS REPORT CASCADE;
DROP TABLE IF EXISTS INCIDENT_TYPE CASCADE;
DROP TABLE IF EXISTS STAFF CASCADE;
DROP TABLE IF EXISTS CITIZEN CASCADE;

-- =====================================================
-- Table: CITIZEN
-- Description: Stores citizen/community member information
-- =====================================================
CREATE TABLE CITIZEN (
    citizen_id VARCHAR(5) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    ic VARCHAR(15) NOT NULL UNIQUE,
    phoneNumber VARCHAR(15) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- Table: STAFF
-- Description: Stores staff/authority member information
-- =====================================================
CREATE TABLE STAFF (
    staff_id VARCHAR(5) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phoneNumber VARCHAR(15) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    department VARCHAR(100),
    position VARCHAR(50),
    role VARCHAR(20) NOT NULL DEFAULT 'Authority' CHECK (role IN ('Admin', 'Authority')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- Table: INCIDENT_TYPE
-- Description: Stores predefined incident categories
-- =====================================================
CREATE TABLE INCIDENT_TYPE (
    incident_id VARCHAR(5) PRIMARY KEY,
    incident_name VARCHAR(100) NOT NULL,
    incident_desc VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- Table: REPORT
-- Description: Stores crime/incident reports submitted by citizens
-- =====================================================
CREATE TABLE REPORT (
    report_id VARCHAR(5) PRIMARY KEY,
    citizen_id VARCHAR(5) NOT NULL,
    incident_id VARCHAR(5) NOT NULL,
    incident_location VARCHAR(500) NOT NULL,
    date_reported DATE NOT NULL DEFAULT CURRENT_DATE,
    time_reported TIME NOT NULL DEFAULT CURRENT_TIME,
    longitude DECIMAL(10,6),
    latitude DECIMAL(10,6),
    priority_level VARCHAR(20) NOT NULL DEFAULT 'Medium' CHECK (priority_level IN ('Low', 'Medium', 'High')),
    report_type VARCHAR(50) NOT NULL CHECK (report_type IN ('Watch Your House', 'Report Crime/Incident')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (citizen_id) REFERENCES CITIZEN(citizen_id) ON DELETE CASCADE,
    FOREIGN KEY (incident_id) REFERENCES INCIDENT_TYPE(incident_id) ON DELETE RESTRICT
);

-- =====================================================
-- Table: REPORT_MEDIA
-- Description: Stores media evidence (images, videos) for reports
-- =====================================================
CREATE TABLE REPORT_MEDIA (
    media_id VARCHAR(5) PRIMARY KEY,
    report_id VARCHAR(5) NOT NULL,
    media_path VARCHAR(255) NOT NULL,
    upload_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (report_id) REFERENCES REPORT(report_id) ON DELETE CASCADE
);

-- =====================================================
-- Table: AUTHORITY_ACTION
-- Description: Stores actions taken by authorities on reports
-- =====================================================
CREATE TABLE AUTHORITY_ACTION (
    action_id SERIAL PRIMARY KEY,
    report_id VARCHAR(5) NOT NULL,
    staff_id VARCHAR(5) NOT NULL,
    authority_desc VARCHAR(255) NOT NULL,
    action_date DATE NOT NULL,
    action_status VARCHAR(50) NOT NULL CHECK (action_status IN ('Pending', 'In Progress', 'Resolved')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (report_id) REFERENCES REPORT(report_id) ON DELETE CASCADE,
    FOREIGN KEY (staff_id) REFERENCES STAFF(staff_id) ON DELETE CASCADE
);

-- =====================================================
-- Table: REPORT_RESOLUTION
-- Description: Stores final resolution status for reports
-- =====================================================
CREATE TABLE REPORT_RESOLUTION (
    resolution_id VARCHAR(6) PRIMARY KEY,
    report_id VARCHAR(5) NOT NULL UNIQUE,
    staff_id VARCHAR(5) NOT NULL,
    status_id VARCHAR(50) NOT NULL CHECK (status_id IN ('Resolved', 'Rejected')),
    date_checked DATE NOT NULL,
    time_checked TIME NOT NULL,
    feedback VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (report_id) REFERENCES REPORT(report_id) ON DELETE CASCADE,
    FOREIGN KEY (staff_id) REFERENCES STAFF(staff_id) ON DELETE CASCADE
);

-- =====================================================
-- Indexes for Performance Optimization
-- =====================================================
CREATE INDEX idx_report_citizen ON REPORT(citizen_id);
CREATE INDEX idx_report_incident ON REPORT(incident_id);
CREATE INDEX idx_report_date ON REPORT(date_reported);
CREATE INDEX idx_report_priority ON REPORT(priority_level);
CREATE INDEX idx_report_status ON AUTHORITY_ACTION(action_status);
CREATE INDEX idx_action_report ON AUTHORITY_ACTION(report_id);
CREATE INDEX idx_media_report ON REPORT_MEDIA(report_id);

-- =====================================================
-- View: ReportDetails
-- Description: Combines report data with citizen and incident information
-- =====================================================
CREATE OR REPLACE VIEW ReportDetails AS
SELECT
    r.report_id,
    r.citizen_id,
    c.name AS citizen_name,
    r.incident_id,
    i.incident_name,
    r.incident_location,
    r.date_reported,
    r.time_reported,
    r.longitude,
    r.latitude,
    r.priority_level,
    r.report_type,
    COALESCE(
        (SELECT action_status
         FROM AUTHORITY_ACTION
         WHERE report_id = r.report_id
         ORDER BY created_at DESC
         LIMIT 1),
        'Pending'
    ) AS status
FROM REPORT r
JOIN CITIZEN c ON r.citizen_id = c.citizen_id
JOIN INCIDENT_TYPE i ON r.incident_id = i.incident_id;

-- =====================================================
-- Function: count_reports
-- Description: Returns total number of reports for a specific citizen
-- =====================================================
CREATE OR REPLACE FUNCTION count_reports(c_id VARCHAR)
RETURNS INTEGER AS $$
DECLARE
    report_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO report_count
    FROM REPORT
    WHERE citizen_id = c_id;

    RETURN report_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Function: log_action
-- Description: Trigger function to log authority actions
-- =====================================================
CREATE OR REPLACE FUNCTION log_action()
RETURNS TRIGGER AS $$
BEGIN
    -- Additional logging logic can be added here
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Trigger: trg_log_action
-- Description: Automatically logs authority actions
-- =====================================================
CREATE TRIGGER trg_log_action
AFTER INSERT ON AUTHORITY_ACTION
FOR EACH ROW
EXECUTE FUNCTION log_action();

-- =====================================================
-- Sample Data Insertion
-- =====================================================

-- Insert Incident Types
INSERT INTO INCIDENT_TYPE (incident_id, incident_name, incident_desc) VALUES
('I001', 'Theft', 'Property theft or burglary'),
('I002', 'Vandalism', 'Property damage or graffiti'),
('I003', 'Suspicious Activity', 'Unusual or concerning behavior'),
('I004', 'Assault', 'Physical violence or threat'),
('I005', 'Burglary', 'Breaking and entering'),
('I006', 'Drug Activity', 'Suspected drug-related incidents'),
('I007', 'Others', 'Other types of incidents');

-- Insert Sample Citizens
INSERT INTO CITIZEN (citizen_id, name, ic, phoneNumber, email, password, address) VALUES
('C001', 'Jane Doe', '920101-14-5678', '0123456789', 'jane@example.com', 'Password123!', 'No 15, Jalan TTP 1/5, Taman Tambun Perdana 1, Durian Tunggal, Melaka'),
('C002', 'John Smith', '850505-01-1234', '0198765432', 'john@example.com', 'Password123!', 'No 22, Jalan TTP 1/8, Taman Tambun Perdana 1, Durian Tunggal, Melaka');

-- Insert Sample Staff
INSERT INTO STAFF (staff_id, name, phoneNumber, email, password, department, position, role) VALUES
('S001', 'Encik Ahmad (Ajk Kampung)', '0112233445', 'ahmad@authority.gov', 'Admin123!', 'Kampung Safety', 'Ajk Kampung', 'Authority'),
('S002', 'Admin Sarah', '0198877665', 'admin@authority.gov', 'Admin123!', 'System Administration', 'System Administrator', 'Admin'),
('S003', 'Cik Fatimah (Ajk Kampung)', '0134455667', 'fatimah@authority.gov', 'Admin123!', 'Kampung Safety', 'Ajk Kampung', 'Authority');

-- Insert Sample Reports
INSERT INTO REPORT (report_id, citizen_id, incident_id, incident_location, date_reported, time_reported, longitude, latitude, priority_level, report_type) VALUES
('R001', 'C001', 'I001', 'Jalan TTP 1/5, Taman Tambun Perdana 1', '2026-05-09', '14:30:00', 102.2501, 2.1896, 'High', 'Report Crime/Incident'),
('R002', 'C002', 'I002', 'Jalan TTP 1/8, Taman Tambun Perdana 1', '2026-05-10', '09:15:00', 102.2819, 2.2595, 'Medium', 'Report Crime/Incident'),
('R003', 'C001', 'I003', 'Jalan TTP 1/12, Taman Tambun Perdana 1', '2026-05-11', '21:45:00', 102.2464, 2.1952, 'High', 'Watch Your House'),
('R004', 'C002', 'I005', 'Jalan TTP 1/3, Taman Tambun Perdana 1', '2026-05-11', '16:20:00', 102.2489, 2.1985, 'Medium', 'Report Crime/Incident'),
('R005', 'C001', 'I006', 'Jalan TTP 1/15, Taman Tambun Perdana 1', '2026-05-12', '08:10:00', 102.2803, 2.2516, 'High', 'Report Crime/Incident');

-- Insert Sample Authority Actions
INSERT INTO AUTHORITY_ACTION (report_id, staff_id, authority_desc, action_date, action_status) VALUES
('R001', 'S001', 'Report received. Investigation started. Patrolling area increased.', '2026-05-09', 'In Progress'),
('R002', 'S001', 'Vandalism documented. Property owner contacted. Repairs scheduled.', '2026-05-10', 'Resolved');

-- Insert Sample Report Resolution
INSERT INTO REPORT_RESOLUTION (resolution_id, report_id, staff_id, status_id, date_checked, time_checked, feedback) VALUES
('RS001', 'R002', 'S001', 'Resolved', '2026-05-10', '16:30:00', 'Issue resolved. Property owner informed. Area will be monitored.');

-- =====================================================
-- Database Comments
-- =====================================================
COMMENT ON TABLE CITIZEN IS 'Stores information about community members who can report incidents';
COMMENT ON TABLE STAFF IS 'Stores information about authorities and administrators';
COMMENT ON TABLE INCIDENT_TYPE IS 'Predefined categories for incident classification';
COMMENT ON TABLE REPORT IS 'Main table for storing crime and incident reports';
COMMENT ON TABLE REPORT_MEDIA IS 'Stores media evidence attached to reports';
COMMENT ON TABLE AUTHORITY_ACTION IS 'Tracks actions taken by authorities on reports';
COMMENT ON TABLE REPORT_RESOLUTION IS 'Final resolution status for completed reports';

-- =====================================================
-- End of Schema
-- =====================================================
