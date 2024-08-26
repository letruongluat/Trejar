﻿using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Runtime.Serialization;
using System.Web;

namespace Ollert.Models
{
    [DataContract]
    public class Tableau : Ollert.Models.IEntity
    {
        public Tableau()
        {
            this.Cartes = new List<Carte>();
        }

        [Key]
        [DataMember]
        public int Id { get; set; }
        [DataMember]
        public string Nom { get; set; }
        [DataMember]
        public int Position { get; set; }
        [DataMember]
        public virtual ICollection<Carte> Cartes { get; set; }
        [Required]
        public virtual Salle Salle { get; set; }

        [NotMapped]
        [DataMember]
        public int SalleId
        {
            get
            {
                if (this.Salle != null)
                    return this.Salle.Id;
                else
                    return -1;
            }
        }
    }
}